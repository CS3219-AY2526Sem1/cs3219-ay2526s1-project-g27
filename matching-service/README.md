# Matching Service

A real-time user matching service designed for collaborative applications. Users are added to a queue, matched based on topic and difficulty preferences, and notified via Server-Sent Events (SSE).  

---

## Table of Contents

- [Architecture](#architecture)  
- [API Endpoints](#api-endpoints)  
- [Matching Server Events](#matching-server-events)  
- [Design Choices](#design-choices)  
- [Matching Algorithm](#matching-algorithm)  
- [Edge Cases](#edge-cases)  
- [Setup and Running](#setup-and-running)  
- [Testing](#testing) 

---

## Architecture

**Overall Matching Service Architecture**  

![Alt text](./images/Screenshot%202025-11-10%20175520.png)

The matching service consists of:  

- **Queue System:** Handles incoming users and manages matchmaking.  
- **Worker:** Processes the queue and determines suitable matches.  
- **Event Stream:** SSE-based event streams communicate real-time updates to clients.  
- **Redis:** Stores matches found by the matching service.  

Refer to [API Endpoints](#api-endpoints) section for API Requests/API Responses and [Matching Server Events](#matching-server-events) for Matching Service emitted events as depicted in the diagram.


---

## API Endpoints

| Operation | HTTP Request | URI | HTTP Response |
|-----------|--------------|-----|----------------|
| Add user to matching queue | POST | `/queue` | **200:** User added to queue<br>**500:** Internal server error, failed to add user to queue |
| Delete user from matching queue | DELETE | `/queue/:userId` | **200:** User successfully removed from queue<br>**500:** Internal server error, failed to remove user from queue |
| Update match acceptance status | PUT | `/matches/:matchId` | **200:** Redirect to collaboration space / waiting for other user<br>**400:** Match expired<br>**500:** Internal server error |
| Retrieve user-specific event stream | GET | `/queue-events/:userId` | (Stream connection — continuous updates via SSE) |
| Check existence of user-specific event stream | HEAD | `/queue-events/:userId` | **200:** Can connect<br>**409:** Duplicate SSE connection exists for user<br>**429:** Another connection attempt in progress |


---

## Matching Server Events

| Event Name | Why Event Is Emitted | Action to Be Taken |
|------------|-------------------|-----------------|
| `matchFound` | User matched with another compatible user | Prompt user to accept match |
| `matchSuccess` | Both users accepted match within time limit | Redirect user to collaboration space |
| `matchFailed` | User did not accept match in time or no match found | Alert user and remove from queue |
| `noQuestion` | Question service has no questions for selected topic/difficulty | Prompt user to choose another topic/difficulty |
| `serverError` | Internal error in matching service | Alert users of service issues |
| `requeue` | Matched user did not accept match | Notify user and re-add to queue |
| `terminate` | Invoked with `matchFailed`, `noQuestion`, `serverError`, or user stop queueing | Close the event stream |

---

## Design Choices

1. **Integration with Frontend**  
   - **SSE (Server-Sent Events)** used for unidirectional communication from server → client.  
   - SSE is lightweight, efficient, and perfect for passive client listening. Unlike WebSockets or polling, it avoids unnecessary duplex communication overhead. 
   - SSE is well suited in our scenario as client passively listen to updates from the server on the match result upon joining the matching queue.

2. **Queuing System**  
   - **BullMQ** with Redis provides low-latency, in-memory queue operations with high throughput.  
   - No persistence is required, keeping the system lightweight for real-time matching.  
   - Able to leverage on BullMQ auto job retries if needed, supporting seamless addition of user back into the matching queue.  
   - Unlike RabbitMQ or Kafka, which are heavier and optimized for long-term message persistence and large-scale event streaming, BullMQ is lightweight and ideal for real-time, transient tasks like matchmaking. Persistent brokers such as RabbitMQ or Kafka would retain “join queue” events even if the matching server is temporarily down, which could cause stale user states — for example, a user who has already left the app might still be considered in the queue once the server recovers. In contrast, BullMQ’s in-memory nature ensures that only active users are processed, keeping the matchmaking state consistent and real-time.

3. **Matching Criteria**  
   - **FIFO (First In, First Out)** ensures fairness.  
   - **Matching Attempts:**  
     - First 3 attempts → exact topic & difficulty match.  
     - Subsequent attempts → weighted similarity score based on topic & difficulty.  
   - Scoring system is extensible for future criteria (e.g., past collaboration history, skill level).  

---

## Matching Algorithm

![Alt text](./images/Screenshot%202025-11-10%20170620.png)  

Broad Overview of Algorithm:  
1. User joins the queue.  
2. Worker attempts to find a match based on the number of processing attempts.  
3. If a match is found, `matchFound` event is emitted.  
4. User can accept/reject match.  
5. `matchSuccess`, `matchFailute` or `requeue` events are emitted accordingly.  

_Note: In the event that the worker fails to match the job, the job joins back the queue for processing after a short delay. This is considered 1 attempt made by worker._

---

## Edge Cases

1. **AFKs (Away From Keyboard)**  
   - Users must accept match manually before redirection to collaboration space, ensuring that users are ready and thus, higher chance of meaningful collaboration.  

2. **No Match Found**  
   - Users are reattempted for matching internally until a max retry limit is reached.  
   - If no match is found, they are removed and alerted.  

3. **Disconnections**  
   - SSE inherently handles disconnections.  
   - Users are removed from the queue upon stream closure and must rejoin.  

4. **Simultaneous Requests**  
   - Redlock-based distributed locking prevents race conditions, especially when the matching criteria, which is the critical section of the code, is executed.
   - Guarantees data integrity by preventing two separate users processed by different workers from being matched with the same user.

---

## Setup and Running

### Prerequisites
- Docker & Docker Compose installed  
- Node.js & npm installed  

To run the service, ensure that the dependencies are installed by running the following command.
```bash 
npm install
```
### Start Service
Ensure that docker is running in the background first before executing the command below to start the matching service.
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```
### Stop Service
To stop matching service, run the command below.
```bash
docker-compose -f docker-compose.dev.yml down
```
## Testing 
To run the test files written for the service, run the following command.
```bash
npm run test
```
