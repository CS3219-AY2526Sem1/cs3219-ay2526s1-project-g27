#!/usr/bin/env node

/* AI Assistance Disclosure:
 Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑04
Scope: 
- Expand 'connection' to include telemetry
Author review: 
- Verfied for correctness by running code
*/

// Env variables required:
// - HOST
// - PORT
// app.get('/user/status/:userId', (req, res) => { //req.param.userId //get from redis }) app.post('/match/start/:jwt', (req, res) => { //req.param.jwt //send to redis }) app.get('/match/status/:jwt', (req, res) => { //req.param.jwt //get from redis }) in redis, the key value stored is {match_id: [user_ids]}. Help to fill in the functions. use ioredis

import WebSocket from 'ws'
import http from 'http'
import * as number from 'lib0/number'
import { setupWSConnection, setPersistence, ROOM_PREFIX, extractRoomName} from './utils.js'
import { mongoPersistence } from './persistence.js'
import url from 'url';
import jwt from 'jsonwebtoken'; // assuming you use jsonwebtoken lib
import express from 'express';
import IORedis from 'ioredis';

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.COLLAB_HOST || '0.0.0.0';
const port = number.parseInt(process.env.COLLAB_HOST || '8081');
const redisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null
};


setPersistence(mongoPersistence);

const app = express();
const redis = new IORedis(redisOptions);

const server = http.createServer(app);

wss.on('connection', (conn, req) => {
  // Print total open connections
  console.log('Client connected');
  console.log('Total connections:', wss.clients.size);

  // When client disconnects
  conn.on('close', (code, reason) => {
    console.log('Client disconnected');
    console.log('Total connections:', wss.clients.size);
    console.log(`Code: ${code}, Reason: ${reason}`);
  });

  // Hand off to the default Yjs handler
  setupWSConnection(conn, req);
});

wss.on('error', (err) => {
  console.error("WebSocket server error:", err);
});

server.on('upgrade', (request, socket, head) => {
  // Expects ws connections on /room/:jwt?userId=<userId>s

  // You may check auth of request here.
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication

  // console.log(request);
  // console.log(head);
  if (!request.url) {
    socket.destroy();
    return;
  }
  const { pathname, query } = url.parse(request.url, true);
  console.log(`Request received on ${pathname}`)
  const roomCheckRegex = new RegExp(`/${ROOM_PREFIX}/*`);
  if (pathname === null || !roomCheckRegex.test(pathname)) {
    console.log(`Invalid ws connection received on ${pathname}`)
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }
  let matchToken = "";
  try {
    matchToken = extractRoomName(pathname);
  } catch (error) {
    if (error instanceof URIError) {
      console.log(`No matchToken supplied on ${pathname}`)
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    } else {
      throw error;
    }
  }
  const userId = query.userId;

  // Verify JWT token
  jwt.verify(matchToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Auth failed during upgrade:', err.message);
      // Reject connection
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    console.log(`Received token: ${JSON.stringify(decoded)}`);
    // Verify user with userId, userId jwt, match jwt
    if (userId != decoded.userA && userId != decoded.userB){
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
      wss.emit('connection', ws, request)
    })
  })
})

app.get('/user/status/:userId', async (req, res) => {
  //get from redis
  const userId = req.params.userId;

  try {
    // Get all keys that match "match:*"
    let cursor = '0';
    const keys = [];
    do {
      const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', 'match:*', 'COUNT', 100);
      keys.push(...batch);
      for(const key of keys) {
        const matchDataString = await redis.get(key)
        const matchData = matchDataString? JSON.parse(matchDataString) : [];
        if (matchData.userA === userId || matchData.userB === userId) {
          const matchId = key.split(':')[1];
          return res.json({ status: 'in_match', matchId });
        }
      }
      cursor = nextCursor;
    } while (cursor !== '0');
    res.json({ status: 'idle' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.post('/match/start/:jwt', async (req, res) => {
  const matchToken = req.params.jwt;
  console.log(`Received Match Start Request for MatchId:${matchToken}`)
  try {
    // Verify JWT token
    jwt.verify(matchToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('Auth failed during match start:', err.message);
        // Reject connection
        return res.status(400).json({ error: 'Invalid matchToken' });
      }
      await redis.set(`match:${matchToken}`, JSON.stringify(decoded));
      return res.json({ success: true, matchId: matchToken });
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.get('/match/status/:jwt', async (req, res) => {
  const token = req.params.jwt;

  try {
    const data = await redis.get(`match:${token}`);

    if (!data) {
      return res.status(404).json({ error: 'Match not found' });
    }
    return res.json({ status: 'in_match', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.post('/match/stop/:jwt', async (req, res) => {
  const matchToken = req.params.jwt;
  try {
    // Verify JWT token
    jwt.verify(matchToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('Auth failed during match end:', err.message);
        // Reject connection
        return res.status(400).json({ error: 'Invalid matchToken' });
      }
      await redis.del(`match:${matchToken}`);
      return res.json({ success: true, matchId: matchToken });
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})


server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})
