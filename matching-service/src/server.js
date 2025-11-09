/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash date: 2025-10-12 18:00
Scope: 
- Advise on how I should be refactoring code in server.js to other files for readability and maintainability.
Author review: 
- Followed recommended file structure and refactor code
*/

const express = require("express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const cors = require("cors");

require('./config/redis');
require('./sse/SSEClientConnection');
const { matchingQueue } = require('./queue/queueManager'); 
const { matchingRouter } = require('./routes/route');

const app = express();
const corsOptions = {
    origin: 'http://localhost',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json()); 

// Setup BullBoard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [new BullMQAdapter(matchingQueue)],
    serverAdapter: serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

app.use(matchingRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

app.get("/", (req, res) => res.send("Hello BullMQ + BullBoard!"));

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

