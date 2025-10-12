const axios = require("axios");
const express = require("express");
const matchingRouter = express.Router();
const { matchingQueue } = require('../queue/queueManager');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections, SSEClientConnection } = require("../sse/SSEClientConnection");
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
        const question = await axios.get("http://question-service:3013/question/random", { categories: [userData.topic], difficulty: userData.topic});
        console.log('Question retrieved', question);
        if (!question) {
            SSEClientConnection.send("noQuestion", { message: "No question available for selected category and difficulty. Please make another selection." });
            handleDisconnect(userData.userId, matchingQueue);
            SSEClientConnection.close();
        }
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
        console.error("Error adding user to queue:", err);
        return res.status(500).json({ error: "Failed to add user to queue" });
    }
});

matchingRouter.get("/queue-events/:userId", (req, res) => {
    const { userId } = req.params;
    console.log(`User ${userId} listening to server!`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // save the response object so we can push events later
    SSEClientConnections.set(userId, new SSEClientConnection(res, Date.now()));

    // clean up on disconnect
    req.on("close", async() => {
        console.log(`Client disconnected: ${userId}`);
        handleDisconnect(userId, matchingQueue);
    });
});

matchingRouter.post("/matches", async(req, res) => {
    const { userId, matchId } = req.body;
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
        // TODO: Consider whether question should be set here or not
        const data = {
            userA: userA,
            userB: userB,
        }
        await finalizeMatch(matchId, data, matchingQueue);
        return res.status(200).json({ message: "Redirecting to collaboration space..." });
    } else {
        return res.status(200).json({ message: "Waiting for other user to accept..." });
    }
});

module.exports = { matchingRouter };
