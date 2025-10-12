
const { redisDB } = require('../config/redis');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections } = require('../sse/SSEClientConnection');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const checkMatchTimeout = async(matchId, matchingQueue) => {
    const allFields = await redisDB.hgetall(matchId);
    for (const field in allFields) {
        if (field.startsWith("accepted:")) {
            const userId = field.split(":")[1];
            const SSEClientConnection = SSEClientConnections.get(userId);
            if (SSEClientConnection) {
                if (allFields[field] === "false") {
                    SSEClientConnection.send("matchFailed", { message: "Did not accept match within time limit, please try again!" });
                    handleDisconnect(userId, matchingQueue);
                    SSEClientConnection.close();
                } else {
                    const job = await matchingQueue.add("add-user",
                        {
                            userId: userId,
                            topic: allFields["topic"],
                            difficulty: allFields["difficulty"],
                            isMatched: false
                        },
                        // for reattempting to match users
                        {
                            attempts: 6,
                            backoff: {
                                type: "fixed",
                                delay: 10000,
                            }, 
                            timestamp: SSEClientConnection.getTimestamp()
                        }
                    );
                    SSEClientConnection.send("requeue", { message: "Matched user failed to accept the match." });
                    SSEClientConnection.updateJobId(job.id);
                }
            } 
        }
    }
    await redisDB.del(matchId);
}

const handleTentativeMatch = async(jobData, matchingQueue) => {
    const userA = jobData.userId;
    const userB = jobData.matchedUserId;
    const matchId = jobData.matchId;

    const match = await redisDB.exists(matchId);
    console.log('Match found or not', match, matchId);

    if (match < 1) {
        const hashFields = [
            "userIds", `${userA},${userB}`, 
            `accepted:${userA}`, "false",
            `accepted:${userB}`, "false",
            "topic", `${jobData.topic}`,
            "difficulty", `${jobData.difficulty}`
        ];
        console.log('Adding match to cache');
        await redisDB.hset(matchId, ...hashFields);
        console.log('Added match to cache successfully');
        const matchData = await redisDB.hgetall(matchId);

        const SSEClientAConnection = SSEClientConnections.get(userA);
        const SSEClientBConnection = SSEClientConnections.get(userB);
        if (SSEClientAConnection) {
            SSEClientAConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
        }
        if (SSEClientBConnection) {
            SSEClientBConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
        }

        setTimeout(async() => await checkMatchTimeout(matchId, matchingQueue), 15000);
    }
}

const finalizeMatch = async(matchId, data, matchingQueue) => {
    console.log('data in finalize match', data, data.userA, data.userB);
    const SSEClientAConnection = SSEClientConnections.get(data.userA);
    const SSEClientBConnection = SSEClientConnections.get(data.userB);
    const signedData = jwt.sign(data, process.env.JWT_SECRET);
    console.log('signed data', signedData);
    if (SSEClientAConnection) {
        SSEClientAConnection.send("matchSuccess", { message: "Redirecting to collaboration space...", ...data, signedData });
        handleDisconnect(data.userA, matchingQueue);
        SSEClientAConnection.close();
    }
    if (SSEClientBConnection) {
        SSEClientBConnection.send("matchSuccess", { message: "Redirecting to collaboration space...", ...data, signedData });
        handleDisconnect(data.userB, matchingQueue);
        SSEClientBConnection.close();
    }
    await redisDB.del(matchId);
    const isMatchDeleted = await redisDB.exists(matchId) < 1 ? true : false;
    console.log('is delete successful', isMatchDeleted);
}

module.exports = {
    checkMatchTimeout,
    handleTentativeMatch,
    finalizeMatch
};
