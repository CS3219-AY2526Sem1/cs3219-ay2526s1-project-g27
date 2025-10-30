
const { redisDB } = require('../config/redis');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections } = require('../sse/SSEClientConnection');
const jwt = require("jsonwebtoken");
const axios = require("axios");
require('dotenv').config();

const requeueUser = async(userData) => {
    const { userId, topic, difficulty, connection, matchingQueue } = userData;
    const job = await matchingQueue.add("add-user",
        {
            userId: userId,
            topic: topic,
            difficulty: difficulty,
            isMatched: false
        },
        // for reattempting to match users
        {
            attempts: 6,
            backoff: {
                type: "fixed",
                delay: 10000,
            }, 
            timestamp: connection.getTimestamp()
        }
    );
    connection.send("requeue", { message: "Matched user failed to accept the match." });
    connection.updateJobId(job.id);
}

const handleServerError = async(userData) => {
    const { userId, matchingQueue, connection } = userData;
    connection.send("serverError", { message: "Internal Server Error." });
    await handleDisconnect(userId, matchingQueue);
    connection.close();
}

const checkMatchTimeout = async(matchId, matchingQueue) => {
    const allFields = await redisDB.hgetall(matchId);
    for (const field in allFields) {
        if (field.startsWith("accepted:")) {
            const userId = field.split(":")[1];
            const SSEClientConnection = SSEClientConnections.get(userId);
            if (SSEClientConnection) {
                if (allFields[field] === "false") {
                    SSEClientConnection.send("matchFailed", { message: "Did not accept match within time limit, please try again!" });
                    await handleDisconnect(userId, matchingQueue);
                    SSEClientConnection.close();
                } else {
                    const userData = {
                        userId: userId,
                        topic: allFields["topic"],
                        difficulty: allFields["difficulty"],
                        connection: SSEClientConnection,
                        matchingQueue: matchingQueue
                    }
                    await requeueUser(userData);
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
    const SSEClientAConnection = SSEClientConnections.get(userA);
    const SSEClientBConnection = SSEClientConnections.get(userB);
    if (SSEClientAConnection && SSEClientBConnection) {
        try {
            const created = await redisDB.hsetnx(matchId, "userIds", `${userA},${userB}`);
        
            if (created === 1) {
                const hashFields = [
                    `accepted:${userA}`, "false",
                    `accepted:${userB}`, "false",
                    "topic", `${jobData.topic}`,
                    "difficulty", `${jobData.difficulty}`
                ];
                console.log('Adding match to cache');
                await redisDB.hset(matchId, ...hashFields);
                console.log('Added match to cache successfully');
                const matchData = await redisDB.hgetall(matchId);
        
                SSEClientAConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
                SSEClientBConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
        
                setTimeout(async() => await checkMatchTimeout(matchId, matchingQueue), 15000);
            }
        } catch (err) {
            console.error(`Error in handing tentative match found for ${matchId}`);
            handleServerError({ userId: userA, matchingQueue: matchingQueue, connection: SSEClientAConnection})
            handleServerError({ userId: userB, matchingQueue: matchingQueue, connection: SSEClientBConnection})
        }
    } else {
        console.error("Cannot match tentatively as user(s) not connected.");
        try {
            if (SSEClientAConnection) {
                const userData = {
                    userId: userA,
                    topic: jobData.topic,
                    difficulty: jobData.difficulty,
                    connection: SSEClientAConnection,
                    matchingQueue: matchingQueue
                }
                await requeueUser(userData)
            }
            if (SSEClientBConnection) {
                const userData = {
                    userId: userB,
                    topic: jobData.topic,
                    difficulty: jobData.difficulty,
                    connection: SSEClientBConnection,
                    matchingQueue: matchingQueue
                }
                await requeueUser(userData)
            }
        } catch (err) {
            if (SSEClientAConnection) {
                handleServerError({ userId: userA, matchingQueue: matchingQueue, connection: SSEClientAConnection});
            }
            if (SSEClientBConnection) {
                handleServerError({ userId: userB, matchingQueue: matchingQueue, connection: SSEClientBConnection});
            }
        }
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
        await handleDisconnect(data.userA, matchingQueue);
        SSEClientAConnection.close();
    }
    if (SSEClientBConnection) {
        SSEClientBConnection.send("matchSuccess", { message: "Redirecting to collaboration space...", ...data, signedData });
        await handleDisconnect(data.userB, matchingQueue);
        SSEClientBConnection.close();
    }
    await redisDB.del(matchId);
    const MATCH_START_ENDPOINT = process.env.COLLAB_URL + `/match/start/${signedData}`;
    axios.post(MATCH_START_ENDPOINT).catch((error) => {
        console.log(error);
    });;
    console.log(`Posted match start request to ${MATCH_START_ENDPOINT}`)
    const isMatchDeleted = await redisDB.exists(matchId) < 1 ? true : false;
    console.log('is delete successful', isMatchDeleted);
}

module.exports = {
    checkMatchTimeout,
    handleTentativeMatch,
    finalizeMatch
};
