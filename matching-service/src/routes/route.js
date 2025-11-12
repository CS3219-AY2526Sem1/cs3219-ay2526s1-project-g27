/*
AI Assistance Disclosure:
Tool: ChatGPT 5  Flash date: 2025-9-28 22:00
Tool: Gemini 2.5 Flash date: 2025-10-12 18:00
Tool: ChatGPT 5 date: 2025-10-30
Scope: 
- Advise on how implementation of Server Side Events should work.
- Solving bug on user being able to match himself.
Author review: 
- Followed recommended logic flow sketch provided.
- Followed debugging solution, tested and works.
*/

const axios = require("axios");
const express = require("express");
const matchingRouter = express.Router();
const { matchingQueue } = require('../queue/queueManager');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections, SSEClientConnection, SSEConnectionLocks } = require("../sse/SSEClientConnection");
const { finalizeMatch } = require('../match/matchHandler');
const { redisDB } = require("../config/redis");

matchingRouter.post("/queue", async(req, res) => {
    try {
        const userData = req.body;
        // to check if server side events is tracked by server
        const SSEClientConnection = SSEClientConnections.get(userData.userId);
        if (!SSEClientConnection) {
            throw new Error();
        }
        console.log(userData.topic, userData.difficulty)
        const question = await axios.post("http://question-service:3013/question/random", { categories: [userData.topic], difficulty: userData.difficulty});
        if (!question) {
            SSEClientConnection.send("noQuestion", { message: "No question available for selected category and difficulty. Please make another selection." });
            await handleDisconnect(userData.userId, matchingQueue);
            SSEClientConnection.close();
        }
        console.log('Question retrieved successfully!');
        const job = await matchingQueue.add("add-user",
            {
                userId: userData.userId,
                topic: userData.topic,
                difficulty: userData.difficulty,
                isMatched: false
            },
            // for reattempting to match users
            {
                attempts: 6,
                backoff: {
                    type: "fixed",
                    delay: 10000,
                }
            }
        );
        console.log('there is SSE connection, adding user');
        SSEClientConnection.send("userAdded", { message: "Successfully added to queue!" });
        SSEClientConnection.updateJobId(job.id);
        return res.status(200).json({ message: "User added to queue" });
    } catch (err) {
        console.error("Error in /queue route:", err);
        return res.status(500).json({ error: "Failed to add user to queue" });
    }
});

matchingRouter.head("/queue-events/:userId", async (req, res) => {
    const { userId } = req.params;

    // 1️⃣ If already connected
    if (SSEClientConnections.has(userId)) {
        console.log(`❌ Duplicate SSE connection for user ${userId}`);
        return res.status(409).json({ error: "User already connected on another browser or tab." });
    }

    // 2️⃣ If locked / in progress
    if (SSEConnectionLocks.has(userId)) {
        return res.status(429).json({ error: "Connection attempt in progress. Try again." });
    }

    // 3️⃣ OK to connect
    res.status(200).end();
});

matchingRouter.get("/queue-events/:userId", async (req, res) => {
    const { userId } = req.params;
    console.log(`User ${userId} attempting to connect...`);

    // Lock the user during connection setup
    SSEConnectionLocks.add(userId);

    try {
        // Proceed to establish SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        res.write(`: connected\n\n`);
        SSEClientConnections.set(userId, new SSEClientConnection(res, Date.now()));
        console.log(`✅ SSE connection established for user ${userId}`);

        req.on("close", async () => {
            console.log(`Client disconnected: ${userId}`);
            await handleDisconnect(userId, matchingQueue);
            SSEClientConnections.delete(userId);
            SSEConnectionLocks.delete(userId);
        });
    } catch (err) {
        console.error(`Error while connecting user ${userId}:`, err);
        res.status(500).json({ error: "Internal error setting up SSE connection" });
    } finally {
        // Always remove lock even on failure
        SSEConnectionLocks.delete(userId);
    }
});

matchingRouter.put("/matches/:matchId", async(req, res) => {
    try {
        const { matchId } = req.params;
        const { userId } = req.body;
        const isMatchExpired = await redisDB.exists(matchId) < 1 ? true : false;
        
        if (isMatchExpired) {
            return res.status(400).json({ error: "Match expired." });
        }
    
        const SSEClientConnection = SSEClientConnections.get(userId);
        if (SSEClientConnection) {
            SSEClientConnection.send("matchAccepted", { message: "Match successfully accepted!" });
        }
        await redisDB.hset(matchId, `accepted:${userId}`, "true");
        
        const allFields = await redisDB.hgetall(matchId);
        console.log('allFields in /matches route', allFields);
        let matchAccepted = true;
        for (const field in allFields) {
            if (field.startsWith("accepted:")) {
                matchAccepted = allFields[field] === "true" ? true && matchAccepted : false;
            }
        }
    
        if (matchAccepted) {
            const users = allFields["userIds"];
            const userA = users.split(",")[0];
            const userB = users.split(",")[1];
            // data to be sent back to client
            // TODO: Consider whether question should be set here or not, consider collaboration data needed here
            const data = {
                userA: userA,
                userB: userB,
                time: Date.now()
            }
            await finalizeMatch(matchId, data, matchingQueue, allFields.topic, allFields.difficulty);
            return res.status(200).json({ message: "Redirecting to collaboration space..." });
        } else {
            return res.status(200).json({ message: "Waiting for other user to accept..." });
        }
    } catch (err) {
        console.error("Error in /matches route:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

matchingRouter.delete("/queue/:userId", async(req, res) => {
    try {
        const { userId } = req.params;
        // to check if server side events is tracked by server
        const SSEClientConnection = SSEClientConnections.get(userId);
        if (SSEClientConnection) {
            await handleDisconnect(userId, matchingQueue);
            SSEClientConnection.close();
        }
        return res.status(200).json({ message: "User successfully removed from queue" });
    } catch (err) {
        console.error("Error in /queue/:userId route:", err);
        return res.status(500).json({ error: "Failed to remove user from queue" });
    }
});

module.exports = { matchingRouter };
