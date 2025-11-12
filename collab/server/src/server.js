#!/usr/bin/env node

/* AI Assistance Disclosure:
 Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑04
Scope: 
- Expand 'connection' to include telemetry
Author review: 
- Verified for correctness by running code
*/

// Env variables required:
// - HOST
// - PORT


import WebSocket from 'ws'
import http from 'http'
import * as number from 'lib0/number'
import { setupWSConnection, setPersistence, extractRoomName} from './utils.js'
import { mongoPersistence } from './persistence.js'
import url from 'url';
import jwt from 'jsonwebtoken'; // assuming you use jsonwebtoken lib
import express from 'express';
import IORedis from 'ioredis';
import path from 'path';
import { match } from 'assert';
import { promisify } from 'util';
import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.COLLAB_HOST || '0.0.0.0';
const port = number.parseInt(process.env.COLLAB_PORT || '8081');
const redisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null
};

setPersistence(mongoPersistence);

const app = express();
const redis = new IORedis(redisOptions);

const server = http.createServer(app);
const jwtVerifyAsync = promisify(jwt.verify);

wss.on('connection', (conn, req) => {
  // When client disconnects
  conn.on('close', (code, reason) => {
    console.log('Client disconnected');
    console.log('Total connections:', wss.clients.size);
    console.log(`Code: ${code}, Reason: ${reason}`);
  });
  if (!req.url) {
    console.log("Empty url supplied");
    conn.close(1007, "Connection is missing url");
    return;
  }
  const { pathname, query } = url.parse(req.url, true);
  if (!pathname) {
    console.log("Connection is missing pathname")
    conn.close(1007, "Connection is missing pathname");
    return;
  }
  if (!query) {
    console.log("Connection is missing query")
    conn.close(1007, "Connection is missing query");
    return;
  }
  const matchToken = extractRoomName(pathname);
  if (! (typeof query.userId == "string")) {
    console.log(`userId is of wrong type. Expected <string>, instead received: ${typeof query.userId}`);
    conn.close(1007, "Invalid userId type");
    return;
  }
  getMatchStatus(matchToken).then( (status) => {
    if (!status) {
      conn.close(3000, "Match has already terminated");
      return;
    }
  }).catch( (error) => {
    if (error instanceof URIError) {
      
    }
  })
  // Print total open connections
  console.log('Client connected');
  console.log('Total connections:', wss.clients.size);

  // Hand off to the default Yjs handler
  setupWSConnection(conn, req, query.userId);
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
  wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
    wss.emit('connection', ws, request)
  });
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

app.post('/match/start/:matchToken', async (req, res) => {
  const matchToken = req.params.matchToken;
  console.log(`Received Match Start Request for MatchId:${matchToken}`)
  try {
    // Verify JWT token
    jwt.verify(matchToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('Auth failed during match start:', err.message);
        // Reject connection
        return res.status(400).json({ error: 'Invalid match token' });
      }
      await redis.set(`match:${matchToken}`, JSON.stringify(decoded));
      return res.json({ success: true, matchToken: matchToken });
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.get('/match/status/:matchToken', async (req, res) => {
  const matchToken = req.params.matchToken;
  console.log(`Status request received for match:${matchToken}`)
  const status = await getMatchStatus(matchToken);
  try{
    if (status) {
      return res.json({ status: 'in_match', matchToken: matchToken });
    } else { 
      return res.json({ status: 'no_match', matchToken: matchToken });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.post('/match/stop/:matchToken', async (req, res) => {
  const matchToken = req.params.matchToken;
  try {
    await stopMatch(matchToken);
    return res.json({ success: true, matchToken: matchToken });
  } catch (error) {
    if (error instanceof URIError) {
      return res.status(400).json({ error: 'Invalid match token' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }    
})

export const stopMatch = async (matchToken) => {
  try {
    const decoded = await jwtVerifyAsync(matchToken, process.env.JWT_SECRET);

    await redis.del(`match:${matchToken}`);
    console.log(`Successfully stopped match with id ${matchToken}`);
  } catch (err) {
    // Safe type narrowing
    if (err instanceof jwt.JsonWebTokenError) {
      console.log('Auth failed during match end');
      throw new URIError("Invalid matchToken");
    }

    console.error("Unexpected error during stopMatch:", err);
    throw new Error("Server error when stopping match");
  }
}

const getMatchStatus = async (matchToken) => {
  try {
    const data = await redis.get(`match:${matchToken}`);

    if (!data) {
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error when getting Match Status");
    throw err;
  }
}


server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})
