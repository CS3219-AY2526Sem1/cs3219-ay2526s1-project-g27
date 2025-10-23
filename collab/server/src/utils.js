import * as Y from 'yjs'
import * as syncProtocol from '@y/protocols/sync'
import * as awarenessProtocol from '@y/protocols/awareness'

import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as map from 'lib0/map'

import * as eventloop from 'lib0/eventloop'

import url from 'url';

import { callbackHandler, isCallbackSet } from './callback.js'
import { mongoPersistence } from './persistence.js'
import { stopMatch } from './server.js'

const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || '2000');
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000')

export const ROOM_PREFIX = "room";

const debouncer = eventloop.createDebouncer(CALLBACK_DEBOUNCE_WAIT, CALLBACK_DEBOUNCE_MAXWAIT)

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0'

/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence = null

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
export const setPersistence = persistence_ => {
  persistence = persistence_
}

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
  * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
  */
export const getPersistence = () => persistence

/**
 * @type {Map<string,WSSharedDoc>}
 */
export const docs = new Map()

const messageSync = 0
const messageAwareness = 1
// const messageAuth = 2

/**
 * @param {Uint8Array} update
 * @param {any} _origin
 * @param {WSSharedDoc} doc
 * @param {any} _tr
 */
const updateHandler = (update, _origin, doc, _tr) => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => send(doc, conn, message))
}

/**
 * @type {(ydoc: Y.Doc) => Promise<void>}
 */
let contentInitializor = _ydoc => Promise.resolve()

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Y.Doc) => Promise<void>} f
 */
export const setContentInitializor = (f) => {
  contentInitializor = f
}

export class WSSharedDoc extends Y.Doc {
  /**
   * @param {string} name
   */
  constructor (name) {
    super({ gc: gcEnabled })
    this.name = name
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    this.conns = new Map()
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)
    
    /**
     * @type {Map<string, Object[]>}
     */
    this.userConnsMap = new Map();

    /**
     * @type {Map<Object, boolean>}
     */
    this.connLivelinessMap = new Map();
    

    /**
     * @type {Map<Object, NodeJS.Timeout>}
     */
    this.connLivelinessIntervals = new Map();

    /**
     * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
     * @param {Object | null} conn Origin is the connection that made the change
     */
    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed)
      if (conn !== null) {
        const connControlledIDs = /** @type {Set<number>} */ (this.conns.get(conn))
        if (connControlledIDs !== undefined) {
          added.forEach(clientID => { connControlledIDs.add(clientID) })
          removed.forEach(clientID => { connControlledIDs.delete(clientID) })
        }
      }
      // broadcast awareness update
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
      const buff = encoding.toUint8Array(encoder)
      this.conns.forEach((_, c) => {
        send(this, c, buff)
      })
    }
    this.awareness.on('update', awarenessChangeHandler)
    this.on('update', /** @type {any} */ (updateHandler))
    if (isCallbackSet) {
      this.on('update', (_update, _origin, doc) => {
        console.log(`Update from ${origin}`)
        debouncer(() => callbackHandler(/** @type {WSSharedDoc} */ (doc)))
      })
    }
    this.whenInitialized = contentInitializor(this)
  }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
export const getYDoc = (docname, gc = true) => map.setIfUndefined(docs, docname, () => {
  const doc = new WSSharedDoc(docname)
  doc.gc = gc
  if (persistence !== null) {
    persistence.bindState(docname, doc)
  }
  docs.set(docname, doc)
  return doc
})

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder()
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)
    switch (messageType) {
      case messageSync: {// User editted something in document
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn)

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder))
        }
        console.log(`Message Received from ${conn} of type ${messageType}`);
        const userId = getUserByConn(doc, conn);
        console.log(`Origin: ${userId}`);
        const isUserAlive = checkUserAlive(doc, userId);
        doc.connLivelinessMap.set(conn, true);
        if (!isUserAlive) { //braodcast to partner that user is now alive
          console.log(`User ${userId} was recently afk`);
          broadcastMessageToAllOtherUsers(doc, userId, 'partnerAlive');
        }
        if (typeof doc.connLivelinessIntervals.get(conn) == "undefined") {
          console.log(`Creating interval for ${userId}`);
          initLivelinessInterval(doc, conn, userId);
        }
        break
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
        console.log(`Awareness Update Received from ${conn} of type ${messageType}`)
        break
      }
    }
    
  } catch (err) {
    console.error(err)
    // @ts-ignore
    doc.emit('error', [err])
  }
}

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
    // @ts-ignore
    const controlledIds = doc.conns.get(conn)
    doc.conns.delete(conn)
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
    console.log(`Closing connection of doc ${doc.name}, Remaining cons: ${doc.conns}`)
    const userId = getUserByConn(doc, conn);
    const userConnections =  doc.userConnsMap.get(userId);
    if (typeof userConnections == 'undefined') {
      console.log(`Untracked user deleted. User: ${userId}`)
      return;
    } else {
      userConnections.splice(userConnections.indexOf(conn), 1);
      if (userConnections.length == 0) {
        doc.userConnsMap.delete(userId);
      }
    }
    console.log(`Closing connection of User:${userId}\nCurrent room state: ${[...doc.userConnsMap.entries()]}`)
    if (doc.userConnsMap.size == 1) {
      broadcastMessageToAllOtherUsers(doc, userId, "lastUser")
    }
    if (doc.conns.size === 0) {
      stopMatch(doc.name).catch( (error) => {
        if (error instanceof URIError) {
          console.log(`Trying to close invalid room ${doc.name}`);
        }
      });
      if (persistence !== null) {
        // if persisted, we store state and destroy ydocument
        persistence.writeState(doc.name, doc).then(() => {
          doc.destroy()
        })
        docs.delete(doc.name)
      }
    }
  }
  conn.close()
}

/**
 * @param {WSSharedDoc} doc
 * @param {import('ws').WebSocket} conn
 * @param {Uint8Array} m
 */
const send = (doc, conn, m) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn)
  }
  try {
    conn.send(m, {}, err => { err != null && closeConn(doc, conn) })
  } catch (e) {
    closeConn(doc, conn)
  }
}

const PING_TIMEOUT = 30000
const LIVELINESS_TIMEOUT = 10000

/**
 * 
 * @param {string} pathname
 * @returns 
 */

export const extractRoomName = (pathname) => {
  const extractRoom = new RegExp(`\/${ROOM_PREFIX}\/(.*)`);
  const match = extractRoom.exec(pathname)
  console.log(`Extracted Room: ${JSON.stringify(match)}`)
  if (!match) {
    console.log(`No matchToken supplied on ${pathname}`)
    throw new URIError("No Room supplied")
  }
  return match[1];
}

// Starts the Liveliness Interval. 
// After the interval, the callback will check if any of the user's connection is alive.
// If all of them have no recent updates, this server will send a 'partnerAfk' event.
const initLivelinessInterval = (doc, conn, userId) => {
  doc.connLivelinessIntervals.set(conn, setInterval( () => {
    if (doc.connLivelinessIntervals.has(conn)) {
      console.log(`Refreshing liveliness interval for ${userId}`)
    }
    console.log(`Liveliness interval triggered for User: ${userId} on conn: ${conn}`);
    const isUserAlive = checkUserAlive(doc, userId);
    console.log(`${userId} connMap: ${doc.userConnsMap.get(userId)}`);
    console.log(`${userId} Liveliness: ${isUserAlive}`)
    doc.connLivelinessMap.set(conn, false);
    if (!isUserAlive) {
      broadcastMessageToAllOtherUsers(doc, userId, 'partnerAfk');
      clearInterval(doc.connLivelinessIntervals.get(conn));
      doc.connLivelinessIntervals.delete(conn);
    }
  }, LIVELINESS_TIMEOUT));
}


/**
 * Broadcast to all connections that do not being to the user specified in the argument
 * @param {WSSharedDoc} doc 
 * @param {string} userId 
 * @param {string} message 
 */
const broadcastMessageToAllOtherUsers = (doc, userId, message) => {
  doc.userConnsMap.forEach((connectionList, user) => {
    if (user !== userId) {
      connectionList.forEach((c) => {
        console.log(`Sending ${message} to ${user}`);
        c.send(message);
      });
    }
  });
};

const checkUserAlive = (doc, userId) => {
  return doc.userConnsMap.get(userId)?.reduce( (prev, curr) => {
    return prev || doc.connLivelinessMap.get(curr);
  }, false);  
}

/**
 * 
 * @param {*} doc 
 * @param {*} conn 
 * @returns 
 */
const getUserByConn = (doc, conn) => {
  let userId = "";
  doc.userConnsMap.forEach( (cs, u) => {
    cs.forEach( (c) => {
      if (c == conn) {
        userId = u; //guaranteed
      }
    });
  });
  return userId;
}


/**
 * @param {import('ws').WebSocket} conn
 * @param {import('http').IncomingMessage} req
 * @param {string} userId
 * @param {any} opts
 */
export const setupWSConnection = (conn, req, userId, { gc = true } = {}) => {
  if (!req.url) {
    conn.close();
    return;
  }
  const { pathname, query } = url.parse(req.url, true);
  if (!pathname) {
    console.log(`No room supplied on ${req.url}`)
    conn.close();
    return;
  }
  let docName = "";
  try {
    docName = extractRoomName(pathname)
    console.log(`Connection attempt to ${docName}`)
  } catch (error) {
    if (error instanceof URIError) {
      console.log(`No room supplied on ${pathname}`)
      conn.close();
      return;
    }
  }

  conn.binaryType = 'arraybuffer'
  // get doc, initialize if it does not exist yet
  const doc = getYDoc(docName, gc)
  doc.conns.set(conn, new Set())

  // Keep track of users and their connections
  if (!doc.userConnsMap.has(userId)) {
    broadcastMessageToAllOtherUsers(doc, userId, "partnerRejoin");
  }
  const userConnections =  doc.userConnsMap.get(userId);
  if (typeof userConnections == 'undefined') {
    doc.userConnsMap.set( userId, [conn]);
  } else {
    userConnections.push(conn);
  }
  console.log(`Client requested to join with userId ${userId}\nCurrent room status: ${[...doc.userConnsMap.entries()]}`)

  initLivelinessInterval(doc, conn, userId);
  doc.connLivelinessMap.set(conn, false);

  // listen and reply to events
  conn.on('message', /** @param {ArrayBuffer} message */ message => messageListener(conn, doc, new Uint8Array(message)))

  // Check if connection is still alive
  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn)
      }
      clearInterval(pingInterval)
    } else if (doc.conns.has(conn)) {
      pongReceived = false
      try {
        conn.ping()
      } catch (e) {
        closeConn(doc, conn)
        clearInterval(pingInterval)
      }
    }
  }, PING_TIMEOUT)
  conn.on('close', () => {
    closeConn(doc, conn)
    clearInterval(pingInterval)
    clearInterval(doc.connLivelinessIntervals.get(conn));
  })
  conn.on('pong', () => {
    pongReceived = true
  })
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    send(doc, conn, encoding.toUint8Array(encoder))
    const awarenessStates = doc.awareness.getStates()
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
      send(doc, conn, encoding.toUint8Array(encoder))
    }
  }
}
