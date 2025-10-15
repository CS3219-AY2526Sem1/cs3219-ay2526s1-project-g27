require('dotenv').config();
const IORedis = require('ioredis');

const redisOptions = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null
};
const redisDB = new IORedis(redisOptions);

redisDB.on('ready', async () => {
    // try to use redis to check functionality
    console.log("Redis connected and ready! Trying to use redis...");
    await redisDB.set("foo", "bar");
    console.log('Usage of redis successful!');
    const result = await redisDB.get("foo");
    console.log("Result:", result); // >>> bar
    await redisDB.del("foo");

    // check that redis always restart with no data
    const keys = await redisDB.keys("*");
    for (const key of keys) {
        console.log("Key inside cache", key);
    }
});
redisDB.on("error", err => console.error("Redis Error", err));

module.exports = {
    redisOptions,
    redisDB, 
};
