const { Queue, Worker, QueueEvents } = require("bullmq");
const { redisOptions } = require('../config/redis');
const { handleTentativeMatch } = require('../match/matchHandler');
const { handleDisconnect } = require('../sse/disconnectHandler');
const { SSEClientConnections } = require('../sse/SSEClientConnection');

const redisConnectionOption = {
    connection: { ...redisOptions }
}
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
                handleDisconnect(job.data.userId, matchingQueue);
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
