const express = require("express");
const { Queue, Worker, QueueEvents } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

require("dotenv").config();

const app = express();

app.use(express.json()); 

const redisOptions = {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, maxRetriesPerRequest: null },
};

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

    /**
     * @param {import("http").ServerResponse} responseStream - The HTTP response stream.
     * @param {string | null} initialJobId - The job ID of the user in the queue.
     */
    constructor(responseStream, initialJobId = null) {
        this.res = responseStream;
        this.jobId = initialJobId;
    }

    // sends data as a standard SSE event
    send(event, data) {
        if (this.res.writable) {
            this.res.write(`event ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
    }

    // close SSE connection
    close() {
        this.res.end();
        console.log(`Server deliberately ended connection for user with job ${this.jobId}`);
    }

    getJobId() {
        return this.jobId;
    }

    updateJobId(jobId) {
        this.jobId = jobId;
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
            SSEClientConnection.send("userAdded", { message: "Successfully added to queue!" });
            SSEClientConnection.updateJobId(job.id);
        }
        return res.status(200).json({ message: "User added to queue" });
    } catch (err) {
        console.error("Error adding user to queue:", err);
        return res.status(500).json({ error: "Failed to add user to queue" });
    }
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
    SSEClientConnections.set(userId, new SSEClientConnection(res));

    // clean up on disconnect
    req.on("close", async() => {
        console.log(`Client disconnected: ${userId}`);
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
    });
});

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
        const SSEClientConnection = SSEClientConnections.get(job.data.userId);
        if (SSEClientConnection) {
            SSEClientConnection.send("matchFound", { message: "Successfully found a match, please accept!" });
        }
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
