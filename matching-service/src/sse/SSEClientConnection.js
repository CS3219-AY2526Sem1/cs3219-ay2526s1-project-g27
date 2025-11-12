/*
AI Assistance Disclosure:
Tool: ChatGPT 5  Flash date: 2025-9-28 22:00
Scope: 
- Advise on how implementation of Server Side Events should work.
- Explore possible options to store the client connections.
Author review: 
- Accepted the recommendation of keeping a map to store the existing client connections.
- Copied the backbone of class declaration and added modifications.
*/

const SSEClientConnections = new Map();
const SSEConnectionLocks = new Set();

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
            this.res.write(`event: terminate\ndata: ${JSON.stringify({ message: 'Stop listening for match events.' })}\n\n`);
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

module.exports = {
    SSEClientConnections,
    SSEClientConnection,
    SSEConnectionLocks
};
