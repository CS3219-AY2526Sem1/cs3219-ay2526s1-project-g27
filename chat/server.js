// use yjs to create a chat backend server

import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { setupWSConnection, extractRoomName } from './utils.js'
import url from 'url';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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

const getMatchStatus = async (matchToken) => {
    try{
        const status_endpoint = `${process.env.COLLAB_URL}/match/status/${matchToken}`
        console.log(`Fetching match status at endpoint ${status_endpoint}`)
        const response = await fetch(status_endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data['status'] === 'in_match';
    } catch (error) {
        console.error('Error fetching match status:', error);
        return false; // or handle the error as needed
    }
}

// Basic health check route
app.get("/", (req, res) => res.send("✅ Yjs chat backend running"));

const PORT = process.env.CHAT_PORT || 8082;
server.listen(PORT, () => console.log(`🚀 Yjs WebSocket server running on port ${PORT}`));
