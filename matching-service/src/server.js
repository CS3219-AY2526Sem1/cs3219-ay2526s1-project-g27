const express = require('express');
const { Queue } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

require('dotenv').config();

const app = express();

const redisOptions = {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
};

const matchingQueue = new Queue('matching-queue', redisOptions);

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
