const express = require('express');
const { Queue, Worker, QueueEvents } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

require('dotenv').config();

const app = express();

app.use(express.json()); 

const redisOptions = {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, maxRetriesPerRequest: null },
};

const matchingQueue = new Queue('matching-queue', redisOptions);

matchingQueue.waitUntilReady()
    .then(() => {
        console.log('Queue connected to Redis');
    })
    .catch((err) => {
        console.error('Failed to connect to Redis:', err);
    });

// Setup BullBoard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullMQAdapter(matchingQueue)],
    serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.get('/', (req, res) => res.send("Hello BullMQ + BullBoard!"));

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

const addUserToQueue = async(req, res) => {
    try {
        const userData = req.body;
        await matchingQueue.add("add-user",
            {
                userID: userData.userID,
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

        return res.status(200).json({ message: "User added to queue" });
    } catch (err) {
        console.error("Error adding user to queue:", err);
        return res.status(500).json({ error: "Failed to add user to queue" });
    }
}

// this is for simulation of adding users into queue
app.post("/queue", addUserToQueue);

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
        await matchingQueue.add("add-user",
            {
                userID: compatibleJob.data.userID,
                topic: compatibleJob.data.topic,
                difficulty: compatibleJob.data.difficulty,
                isMatched: true,
                matchedUserID: jobInProcess.data.userID
            },
            { lifo: true }
        );
        await jobInProcess.updateData({
            userID: jobInProcess.data.userID,
            topic: jobInProcess.data.topic,
            difficulty: jobInProcess.data.difficulty,
            isMatched: true,
            matchedUserID: compatibleJob.data.userID
        });
        await compatibleJob.remove();
        return "Match found";
    } else {
        console.log(`No match found for Job In Queue ${jobInProcess.id}, ${jobInProcess.data.userID}`)
        throw new Error('No match found, retrying.');
    }
}
const worker = new Worker('matching-queue', processJob, redisOptions);

worker.waitUntilReady()
    .then(() => {
        console.log('Worker is ready for job processing');
    })
    .catch((err) => {
        console.error('Worker has failed to connect to Redis', err);
    });

const matchingQueueEvents = new QueueEvents('matching-queue', redisOptions);

matchingQueueEvents.waitUntilReady()
    .then(() => {
        console.log('Queue Event is ready to listen for events');
    })
    .catch((err) => {
        console.error('Queue Event has failed to connect to Redis', err);
    });

// to act on matched users
matchingQueueEvents.on('completed', async ({ jobId }) => {
    const job = await matchingQueue.getJob(jobId);

    if (job) {
        console.log(`Job ${job.id} completed.`, job.data);
    } else {
        console.log(`Job with ID ${jobId} not found.`);
    }
})

// to act on failed match after user is in queue for approx 1 minute
matchingQueueEvents.on('failed', async ({ failedReason, jobId }) => {
    const job = await matchingQueue.getJob(jobId);

    if (job) {
        console.log(`Job ${jobId} failed attempt ${job.attemptsMade} out of ${job.opts.attempts}. Error: ${failedReason}`);
        if (job.attemptsMade >= job.opts.attempts) {
            console.log(`Job ${jobId} maximum attempt reached.`);
            await job.remove();
        } else {
            console.log(`Job ${jobId} retrying.`);
        }
    } else {
        console.log(`Job with ID ${jobId} not found.`);
    }  
})

// to check jobs are actually removed
matchingQueueEvents.on('removed', ({ jobId }) => {
    console.log(`Job ${jobId} successfully removed from queue.`);
})
