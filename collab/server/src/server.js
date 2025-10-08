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


import WebSocket from 'ws'
import http from 'http'
import * as number from 'lib0/number'
import { setupWSConnection, setPersistence } from './utils.js'
import { mongoPersistence } from './persistence.js'

const wss = new WebSocket.Server({ noServer: true })
const host = process.env.HOST || '0.0.0.0'
const port = number.parseInt(process.env.PORT || '8081')

setPersistence(mongoPersistence)

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

/** setupWSConnection 
 * conn, req, { docName = (req.url || '').slice(1).split('?')[0], gc = true
 */
wss.on('connection', (conn, req) => {
  // Print total open connections
  console.log('Client connected');
  console.log('Total connections:', wss.clients.size);

  // Optional: extract room/document name
  const room = (req.url || '').slice(1).split('?')[0];
  console.log('Room:', room);

  // When client disconnects
  conn.on('close', () => {
    console.log('Client disconnected');
    console.log('Total connections:', wss.clients.size);
  });

  // Hand off to the default Yjs handler
  setupWSConnection(conn, req);
});

wss.on('error', (err) => {
  console.error("WebSocket server error:", err);
});

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here.
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication

  console.log(request);
  
  wss.handleUpgrade(request, socket, head, /** @param {any} ws */ ws => {
    wss.emit('connection', ws, request)
  })
})

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`)
})
