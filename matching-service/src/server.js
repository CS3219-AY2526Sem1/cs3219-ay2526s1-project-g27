const express = require("express");
const { Queue, Worker, QueueEvents } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const IORedis = require('ioredis');
const cors = require("cors");

require("dotenv").config();

const app = express();
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json()); 

const redisOptions = {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, maxRetriesPerRequest: null },
};

const tentativeMatchCache = new IORedis(redisOptions.connection); 
tentativeMatchCache.on('ready', async () => {
    // try to use redis to check functionality
    console.log("Client connected and ready! Trying to use cache...");
    await tentativeMatchCache.set("foo", "bar");
    console.log('Usage of cache successful!');
    const result = await tentativeMatchCache.get("foo");
    console.log("Cache result:", result); // >>> bar
    await tentativeMatchCache.del("foo");

    // check that redis always restart with no data
    const keys = await tentativeMatchCache.keys("*");
    for (const key of keys) {
        console.log("Key inside cache", key);
    }
});
tentativeMatchCache.on("error", err => console.log("Redis Client Error", err));

const matchingQueue = new Queue("matching-queue", redisOptions);

matchingQueue.waitUntilReady()
    .then(() => {
        console.log("Queue connected to Redis");
    })
    .catch((err) => {
        console.error("Failed to connect to Redis:", err);
    });

// Setup BullBoard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [new BullMQAdapter(matchingQueue)],
    serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.get("/", (req, res) => res.send("Hello BullMQ + BullBoard!"));

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

class SSEClientConnection {
    res;
    jobId;
    timestamp;

    /**
     * @param {import("http").ServerResponse} responseStream - The HTTP response stream.
     * @param {string | null} initialJobId - The job ID of the user in the queue.
     * @param {number} timestamp - The time at which the user joins the queue.
     */
    constructor(responseStream, timestamp, initialJobId = null) {
        this.res = responseStream;
        this.jobId = initialJobId;
        this.timestamp = timestamp;
    }

    // sends data as a standard SSE event
    send(event, data) {
        console.log('sending SSE event');
        if (this.res.writable) {
            console.log('can send SSE event');
            this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
    }

    // close SSE connection
    close() {
        if (this.res.writable) {
            this.res.write("event: terminate\ndata: Stop listening for match events.\n\n");
        }
    }

    getJobId() {
        return this.jobId;
    }

    updateJobId(jobId) {
        this.jobId = jobId;
    }

    getTimestamp() {
        return this.timestamp;
    }
}

// map to track server side events connections per user in queue
const SSEClientConnections = new Map();

const addUserToQueue = async(req, res) => {
    try {
        const userData = req.body;
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
        // to check if server side events is tracked by server
        const SSEClientConnection = SSEClientConnections.get(userData.userId);
        if (SSEClientConnection) {
            console.log('there is SSE connection, adding user');
            SSEClientConnection.send("userAdded", { message: "Successfully added to queue!" });
            SSEClientConnection.updateJobId(job.id);
        } else {
            throw new Error();
        }
        return res.status(200).json({ message: "User added to queue" });
    } catch (err) {
        console.error("Error adding user to queue:", err);
        return res.status(500).json({ error: "Failed to add user to queue" });
    }
}

const handleDisconnect = async(userId) => {
    const SSEClientConnection = SSEClientConnections.get(userId);
    // remove user from queue
    if (SSEClientConnection) {
        console.log("Got SSE Client connection", SSEClientConnection);
        const jobId = SSEClientConnection.getJobId();
        const job = await matchingQueue.getJob(jobId);
        if (job) {
            console.log("Attempt to remove job due to disconnect");
            await job.remove();
            console.log("Removed job due to disconnect");
        }
    }
    console.log("Attempt to delete SSE client connection");
    SSEClientConnections.delete(userId);
    console.log("Deleted SSE client connection");
}

// routes that server provides
// add user to queue
app.post("/queue", addUserToQueue);

// get server side events for users who join queue
app.get("/queue-events/:userId", (req, res) => {
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
        handleDisconnect(userId);
    });
});

const checkMatchTimeout = async(matchId) => {
    const allFields = await tentativeMatchCache.hgetall(matchId);
    for (const field in allFields) {
        if (field.startsWith("accepted:")) {
            const userId = field.split(":")[1];
            const SSEClientConnection = SSEClientConnections.get(userId);
            if (SSEClientConnection) {
                if (allFields[field] === "false") {
                    SSEClientConnection.send("matchFailed", { message: "Did not accept match within time limit, please try again!" });
                    handleDisconnect(userId);
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
    await tentativeMatchCache.del(matchId);
}

const handleTentativeMatch = async(jobData) => {
    const userA = jobData.userId;
    const userB = jobData.matchedUserId;
    const matchId = jobData.matchId;

    const match = await tentativeMatchCache.exists(matchId);
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
        await tentativeMatchCache.hset(matchId, ...hashFields);
        console.log('Added match to cache successfully');
        const matchData = await tentativeMatchCache.hgetall(matchId);

        const SSEClientAConnection = SSEClientConnections.get(userA);
        const SSEClientBConnection = SSEClientConnections.get(userB);
        if (SSEClientAConnection) {
            SSEClientAConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
        }
        if (SSEClientBConnection) {
            SSEClientBConnection.send("matchFound", { message: "Successfully found a match, please accept!", matchId: matchId, matchData });
        }

        setTimeout(async() => await checkMatchTimeout(matchId), 15000);
    }
}

const finalizeMatch = async(matchId, data) => {
    console.log('data in finalize match', data, data.userA, data.userB);
    const SSEClientAConnection = SSEClientConnections.get(data.userA);
    const SSEClientBConnection = SSEClientConnections.get(data.userB);
    if (SSEClientAConnection) {
        SSEClientAConnection.send("matchSuccess", { message: "Redirecting to collaboration space...", data });
        handleDisconnect(data.userA);
        SSEClientAConnection.close();
    }
    if (SSEClientBConnection) {
        SSEClientBConnection.send("matchSuccess", { message: "Redirecting to collaboration space...", data });
        handleDisconnect(data.userB);
        SSEClientBConnection.close();
    }
    await tentativeMatchCache.del(matchId);
    const isMatchDeleted = await tentativeMatchCache.exists(matchId) < 1 ? true : false;
    console.log('is delete successful', isMatchDeleted);
}

const acceptTentativeMatch = async(req, res) => {
    const { userId, matchId } = req.body;
    const isMatchExpired = await tentativeMatchCache.exists(matchId) < 1 ? true : false;
    
    if (isMatchExpired) {
        return res.status(400).json({ error: "Match expired." });
    }

    const SSEClientConnection = SSEClientConnections.get(userId);
    if (SSEClientConnection) {
        SSEClientConnection.send("matchAccepted", { message: "Match successfully accepted!" });
    }
    await tentativeMatchCache.hset(matchId, `accepted:${userId}`, "true");
    
    const allFields = await tentativeMatchCache.hgetall(matchId);
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
        const data = {
            userA: userA,
            userB: userB,
        }
        await finalizeMatch(matchId, data);
        return res.status(200).json({ message: "Redirecting to collaboration space..." });
    } else {
        return res.status(200).json({ message: "Waiting for other user to accept..." });
    }
}

app.post("/matches", acceptTentativeMatch);

/*
Matching Algorithm
Delayed Job: Job that reattempts to match user after initial unsucessful attempts
Waiting Job: Job waiting to be processed
Failed Job: Job that fails to match user either rejoins queue as a Delayed Job or gets removed completely
Completed Job: Job that successfully matched user

Everytime a job is processed, it checks against the entire queue and finds the oldest compatible job.
If no compatible job found, will retry up to the maximum attempt stated in the job. Currently set as 6 with delay of 10s between attempts.
*/
const processJob = async(jobInProcess) => {
    console.log(`Job ${jobInProcess.id} in process.`)
    if (jobInProcess.data.isMatched) {
        return "Match found";
    }
    const delayedJobs = await matchingQueue.getDelayed();
    const waitingJobs = await matchingQueue.getWaiting();
    const allJobsInQueue = [...delayedJobs, ...waitingJobs];
    const compatibleJobs = allJobsInQueue.filter(job => job.data.topic === jobInProcess.data.topic && job.data.difficulty === jobInProcess.data.difficulty);
    
    if (compatibleJobs.length > 0) {
        const compatibleJob = compatibleJobs.reduce((previousJob, currentJob) => {
            return (currentJob.timestamp < previousJob.timestamp) ? currentJob : previousJob
        });
        console.log(`Compatible Job ${compatibleJob.id} with Job In Queue ${jobInProcess.id}.`);
        const newJob = await matchingQueue.add("add-user",
            {   
                matchId: `${compatibleJob.data.userId}-${jobInProcess.data.userId}`,
                userId: compatibleJob.data.userId,
                topic: compatibleJob.data.topic,
                difficulty: compatibleJob.data.difficulty,
                isMatched: true,
                matchedUserId: jobInProcess.data.userId
            },
            { lifo: true }
        );
        const SSEClientConnection = SSEClientConnections.get(newJob.data.userId);
        if (SSEClientConnection) {
            SSEClientConnection.send("changeJobId", { message: "JobId updated!" });
            SSEClientConnection.updateJobId(newJob.id);
            console.log("Updated jobID");
        }
        await jobInProcess.updateData({
            matchId: `${compatibleJob.data.userId}-${jobInProcess.data.userId}`,
            userId: jobInProcess.data.userId,
            topic: jobInProcess.data.topic,
            difficulty: jobInProcess.data.difficulty,
            isMatched: true,
            matchedUserId: compatibleJob.data.userId
        });
        await compatibleJob.remove();
        return "Match found";
    } else {
        console.log(`No match found for Job In Queue ${jobInProcess.id}, ${jobInProcess.data.userId}`)
        throw new Error("No match found, retrying.");
    }
}
const worker = new Worker("matching-queue", processJob, redisOptions);

worker.waitUntilReady()
    .then(() => {
        console.log("Worker is ready for job processing");
    })
    .catch((err) => {
        console.error("Worker has failed to connect to Redis", err);
    });

const matchingQueueEvents = new QueueEvents("matching-queue", redisOptions);

matchingQueueEvents.waitUntilReady()
    .then(() => {
        console.log("Queue Event is ready to listen for events");
    })
    .catch((err) => {
        console.error("Queue Event has failed to connect to Redis", err);
    });

// to act on matched users
matchingQueueEvents.on("completed", async ({ jobId }) => {
    const job = await matchingQueue.getJob(jobId);

    if (job) {
        console.log(`Job ${job.id} completed.`, job.data);
        await handleTentativeMatch(job.data);
    } else {
        console.log(`Job with ID ${jobId} not found.`);
    }
})

// to act on failed match after user is in queue for approx 1 minute
matchingQueueEvents.on("failed", async ({ failedReason, jobId }) => {
    const job = await matchingQueue.getJob(jobId);

    if (job) {
        console.log(`Job ${jobId} failed attempt ${job.attemptsMade} out of ${job.opts.attempts}. Error: ${failedReason}`);
        if (job.attemptsMade >= job.opts.attempts) {
            console.log(`Job ${jobId} maximum attempt reached.`);
            const SSEClientConnection = SSEClientConnections.get(job.data.userId);
            if (SSEClientConnection) {
                SSEClientConnection.send("matchFailed", { message: "Unable to find a match, please try again!" });
                handleDisconnect(job.data.userId);
                SSEClientConnection.close();
            }
        } else {
            console.log(`Job ${jobId} retrying.`);
        }
    } else {
        console.log(`Job with ID ${jobId} not found.`);
    }  
})

// to check jobs are actually removed
matchingQueueEvents.on("removed", ({ jobId }) => {
    console.log(`Job ${jobId} successfully removed from queue.`);
})
