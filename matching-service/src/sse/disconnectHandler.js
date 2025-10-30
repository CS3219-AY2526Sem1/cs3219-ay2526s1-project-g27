const { SSEClientConnections } = require('./SSEClientConnection');

const handleDisconnect = async(userId, matchingQueue) => {
    const SSEClientConnection = SSEClientConnections.get(userId);
    // remove user from queue
    if (SSEClientConnection) {
        console.log("Got SSE Client connection");
        const jobId = SSEClientConnection.getJobId();
        if (jobId) {
            const job = await matchingQueue.getJob(jobId);
            if (job) {
                console.log("Attempt to remove job due to disconnect");
                await job.remove();
                console.log("Removed job due to disconnect");
            }
        }
    }
    console.log("Attempt to delete SSE client connection");
    SSEClientConnections.delete(userId);
    console.log("Deleted SSE client connection");
}

module.exports = { handleDisconnect };
