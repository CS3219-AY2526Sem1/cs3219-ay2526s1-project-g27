/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
Scope: 
- Generated template code
Author review: 
- Verfied for correctness by reading code
*/

const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils.js');
const http = require('http');

// Optional: persistence
const map = new Map(); // In-memory, replace with LevelDB or Redis for real persistence

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, {
    gc: true,
    persistenceBindToRoom: true, // Enable persistence hook
    persistedDocuments: map,     // Replace with actual DB-backed map for prod
  });
});

const PORT = 1234;
server.listen(PORT, () => {
  console.log(`🧠 Yjs WebSocket server running at ws://localhost:${PORT}`);
});