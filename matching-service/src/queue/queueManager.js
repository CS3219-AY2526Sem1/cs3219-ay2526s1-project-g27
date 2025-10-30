const { Queue, Worker, QueueEvents } = require("bullmq");
const { redisDB, redisOptions } = require('../config/redis');
const { handleTentativeMatch } = require('../match/matchHandler');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections } = require('../sse/SSEClientConnection');
const RedlockModule = require("redlock");
const Redlock = RedlockModule.default; 

const redisConnectionOption = {
    connection: { ...redisOptions }
}
const redlock = new Redlock([redisDB]);
// test redlock
const testTwoClients = async() => {
    const resource = "locks:test-lock";
    const ttl = 5000;

    try {
        const lock1 = await redlock.acquire([resource], ttl);
        console.log("Client 1 acquired lock");

        const lock2 = await redlock.acquire([resource], ttl);
        console.log("Client 2 acquired lock (should NOT happen!)");
    } catch (err) {
        console.log("Client 2 failed to acquire lock (expected)", err.message);
    }
}

testTwoClients();

const matchingQueue = new Queue("matching-queue", redisConnectionOption);

matchingQueue.waitUntilReady()
    .then(() => {
        console.log("Queue connected to Redis");
    })
    .catch((err) => {
        console.error("Failed to connect to Redis:", err);
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
const MAX_RECHECK_ATTEMPTS = 3;     // number of quick rechecks before giving up
const RECHECK_DELAY_MS = 300;       // base delay between rechecks
const JITTER_MS = 200;              // random jitter range

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const processJob = async (jobInProcess) => {
    console.log(`Job ${jobInProcess.id} in process.`);

    if (jobInProcess.data.isMatched) return "Match found";

    for (let attempt = 1; attempt <= MAX_RECHECK_ATTEMPTS; attempt++) {
        const delayedJobs = await matchingQueue.getDelayed();
        const waitingJobs = await matchingQueue.getWaiting();
        const allJobsInQueue = [...delayedJobs, ...waitingJobs];
        const compatibleJobs = allJobsInQueue.filter(job =>
            job.data.topic === jobInProcess.data.topic &&
            job.data.difficulty === jobInProcess.data.difficulty
        );

        if (compatibleJobs.length === 0) {
            console.log(`Attempt ${attempt}: No compatible jobs found.`);
        } else {
            const compatibleJob = compatibleJobs.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
            const lockKey = `lock:job:${compatibleJob.id}`;

            try {
                // try acquiring lock for this compatible job
                await redlock.using([lockKey], 2000, async () => {
                    console.log(`Lock acquired for job ${compatibleJob.id} by ${jobInProcess.id}`);

                    // double-check that job not already matched
                    const existing = await matchingQueue.getJob(compatibleJob.id);
                    if (!existing) throw new Error("Job already removed by another worker");

                    const newJob = await matchingQueue.add("add-user", {
                        matchId: `${compatibleJob.data.userId}-${jobInProcess.data.userId}`,
                        userId: compatibleJob.data.userId,
                        topic: compatibleJob.data.topic,
                        difficulty: compatibleJob.data.difficulty,
                        isMatched: true,
                        matchedUserId: jobInProcess.data.userId
                    }, { lifo: true });

                    const SSEClientConnection = SSEClientConnections.get(newJob.data.userId);
                    if (SSEClientConnection) {
                        SSEClientConnection.updateJobId(newJob.id);
                    }

                    await jobInProcess.updateData({
                        ...jobInProcess.data,
                        matchId: `${compatibleJob.data.userId}-${jobInProcess.data.userId}`,
                        isMatched: true,
                        matchedUserId: compatibleJob.data.userId
                    });

                    await compatibleJob.remove();
                });

                return "Match found";

            } catch (err) {
                // lock was taken by another worker
                if (err.name === "ExecutionError" || err.message.includes("Lock not granted")) {
                    console.log(`Lock unavailable for job ${compatibleJob.id}, rechecking... (${attempt}/${MAX_RECHECK_ATTEMPTS})`);
                } else {
                    throw err;
                }
            }
        }

        // small randomized delay before rechecking
        const delay = RECHECK_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
        await sleep(delay);
    }

    // triggers BullMQ’s retry cycle after failing all recheck attempts
    console.log(`No match found for Job In Queue ${jobInProcess.id}, ${jobInProcess.data.userId}`)
    throw new Error("No match found after quick rechecks, retrying later.");
};

const worker = new Worker("matching-queue", processJob, redisConnectionOption);

worker.waitUntilReady()
    .then(() => {
        console.log("Worker is ready for job processing");
    })
    .catch((err) => {
        console.error("Worker has failed to connect to Redis", err);
    });

const matchingQueueEvents = new QueueEvents("matching-queue", redisConnectionOption);

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
        await handleTentativeMatch(job.data, matchingQueue);
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
                await handleDisconnect(job.data.userId, matchingQueue);
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

module.exports = { matchingQueue };
