# CS3219 Project: PeerPrep

A comprehensive overview of PeerPrep, a real-time peer programming interview preparation platform where users can match with peers, collaborate on coding problems, and chat in real-time. This document covers the containerization strategy and deployment architecture of PeerPrep specifically in terms of Docker-based microservice architecture, container configurations, and deployment patterns.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Service Documentation](#service-documentation)
- [API Documentation](#api-documentation)
- [Design Choices](#design-choices)
- [Runbooks](#runbooks)

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 22+ (for local development without containers)

### Running with Docker Compose

```bash
# Start all services in development mode
docker-compose up

# Start services in the background
docker-compose up -d

# View logs from all services
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up volumes (removes persistent data)
docker-compose down -v
```

The application will be available at:
- **Frontend**: `http://localhost:5173` (direct access) or `http://localhost:80` (through nginx)
- **Nginx Gateway**: `http://localhost:80`
- **API Base**: `/api` (proxied through nginx)

### Running Specific Services

```bash
# Start only the frontend and nginx gateway
docker-compose up frontend react-app

# Start backend services without frontend
docker-compose up auth-service question-service matching-service collab-service chat-service

# Restart a specific service
docker-compose restart auth-service

# View logs for a specific service
docker-compose logs -f auth-service
```

## Architecture Overview

### Microservices Architecture

PeerPrep is built as a collection of containerized microservices communicating through a central nginx gateway:

[INSERT IMAGE HERE]

### Container Architecture

**Network**: `leetcode_collab_net` (custom bridge network)
- All services communicate via internal container DNS
- Services are referenced by container name (e.g., `http://auth-service:8000`)

**Volumes**:
- `mongo-data`: Persistent MongoDB data
- `./logs/nginx`: Nginx access/error logs (bind mount)
- `./auth-service`, `./frontend`, etc.: Development source code (bind mount for hot reload)

**Service Interdependencies**:
- Nginx depends on: Auth Service, Question Service
- Auth Service depends on: MongoDB
- Question Service depends on: MongoDB
- Matching Service depends on: Redis
- Collab Service depends on: MongoDB, Redis
- Chat Service: No external dependencies

## Service Documentation

### 1. Nginx Gateway Container

**Purpose**: Central reverse proxy and API gateway

**Image**: Custom multi-stage build from `nginx:alpine`

**Ports**: 
- `80` (HTTP)

**Volumes**:
- `/var/log/nginx` (bind mount to `./logs/nginx`)
- `/etc/nginx/nginx.conf` (bind mount from `./nginx-gateway/config/nginx.conf`)
- `/usr/share/nginx/html` (contains frontend static assets)

**Key Features**:
- Serves frontend React static files (built in Stage 1)
- Proxies API requests to backend microservices
- JWT verification for protected endpoints
- WebSocket upgrade support (Connection: upgrade)
- JSON-formatted logging for analytics
- Gzip compression for all text-based responses

**Dockerfile Strategy**: Multi-stage build
```
Stage 1: Build frontend React app (node:22-alpine)
  └─ npm install & npm run build
  └─ Outputs: /app/dist (built static files)

Stage 2: Nginx server (nginx:alpine)
  └─ COPY --from=builder /app/dist /usr/share/nginx/html
  └─ Runs nginx with custom configuration
```

**Configuration Highlights**:
- SPA fallback: All unknown routes redirect to `/index.html`
- Cache control: HTML files cached with `no-cache` directive
- Compression: gzip enabled for JSON, JavaScript, CSS
- Large header buffer: 32KB for handling large JWT tokens
- Connection upgrade maps for WebSocket support

**Related Files**: 
- [`./nginx-gateway/Dockerfile`](./nginx-gateway/Dockerfile)
- [`./nginx-gateway/config/nginx.conf`](./nginx-gateway/config/nginx.conf)

---

### 2. Auth Service Container

**Purpose**: JWT-based authentication and user management

**Image**: Node.js 22 Alpine with TypeScript

**Ports**:
- `8000` (HTTP API)

**Environment Variables**:
```bash
DB_LOCAL_URI=mongodb://mongo:27017
DB_NAME=PeerPrepAuthDB
AUTH_PORT=8000
BETTER_AUTH_SECRET=[secret key]
BETTER_AUTH_URL=http://localhost:8000
FRONTEND_URL=http://localhost:80
```

**Base Technology**: Express.js + Better Auth + Mongoose

**Key Endpoints**:
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - JWT login
- `GET /api/auth/jwks` - JWKS endpoint (used by nginx for JWT verification)
- `POST /api/jwt/verify-jwt` - Token verification endpoint
- `GET /api/users/{userId}/profile` - User profile retrieval
- `PUT /api/users/{userId}/profile` - Update user profile

**Dockerfile Strategy**: Development-optimized
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install  # Includes devDependencies for ts-node
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]  # Uses nodemon + ts-node
```

**Volume Mounts**:
- `/app` (bind mount to `./auth-service`) - hot reload on source changes
- `/app/node_modules` (anonymous volume) - isolated node_modules

**Dependencies**:
- `better-auth`: JWT & session management
- `mongoose`: MongoDB ORM
- `express`: HTTP framework
- `cors`: Cross-origin request handling
- `resend`: Email sending (registration confirmations)

**Related Files**:
- [`./auth-service/Dockerfile.dev`](./auth-service/Dockerfile.dev)
- [`./auth-service/package.json`](./auth-service/package.json)
- [`./auth-service/src/server.ts`](./auth-service/src/server.ts)

---

### 3. Question Service Container

**Purpose**: Coding problem repository and retrieval

**Image**: Node.js 22 (standard, not Alpine)

**Ports**:
- `3013` (HTTP API)

**Environment Variables**:
```bash
DB_LOCAL_URI=mongodb://mongo:27017
```

**Base Technology**: Express.js + Mongoose

**Key Endpoints**:
- `GET /question/random` - Fetch random coding problem
- `POST /question` - Create new question
- `GET /question/:id` - Get question by ID
- `GET /question/attempt/{userId}` - Get user's question attempts
- `POST /question/attempt` - Log question attempt

**Dockerfile Strategy**: Standard development setup
```dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000  # Note: Config may differ
CMD ["npm", "start"]
```

**Volume Mounts**:
- `/app` (bind mount to `./question-service`) - hot reload
- `/app/node_modules` (anonymous volume)

**Dependencies**:
- `mongoose`: MongoDB ORM
- `express`: HTTP framework
- `cors`: CORS middleware

**Related Files**:
- [`./question-service/dockerfile`](./question-service/dockerfile)
- [`./question-service/package.json`](./question-service/package.json)
- [`./question-service/server.js`](./question-service/server.js)

---

### 4. Matching Service Container

**Purpose**: Real-time peer matching with queue management

**Image**: Node.js 22 Alpine

**Ports**:
- `3001` (HTTP API)

**Environment Variables**:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=[secret]
```

**Base Technology**: Express.js + BullMQ (job queue) + Redis

**Key Endpoints**:
- `POST /queue` - Join matching queue
- `GET /queue-events/{userId}` - SSE stream for match notifications
- `DELETE /queue/{userId}` - Leave queue
- `POST /matches` - Accept match
- `GET /matches/{matchId}` - Get match status

**Dockerfile Strategy**: Production-optimized with non-root user
```dockerfile
FROM node:22-alpine
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production=false
COPY . .
EXPOSE 3001
USER node  # Run as non-root
CMD ["npm", "run", "dev"]
```

**Security Features**:
- Non-root user execution
- Explicit ownership of directories
- Separated application directory from root

**Volume Mounts**:
- `/app` (bind mount to `./matching-service`) - hot reload
- `/app/node_modules` (anonymous volume)

**Key Technology**: BullMQ for job queueing
- Uses Redis as backend
- Manages matching queue with automatic TTL
- Supports job retries and failure handling

**Related Files**:
- [`./matching-service/Dockerfile`](./matching-service/Dockerfile)
- [`./matching-service/package.json`](./matching-service/package.json)
- [`./matching-service/src/server.js`](./matching-service/src/server.js)

---

### 5. Collab Service Container

**Purpose**: Real-time collaborative code editor

**Image**: Node.js 22 Alpine

**Ports**:
- `8081` (WebSocket for code editing)

**Environment Variables**:
```bash
COLLAB_HOST=0.0.0.0
COLLAB_PORT=8081
DB_LOCAL_URI=mongodb://mongo:27017
YJS_DB_NAME=yjs-docs
YJS_COLLECTION_NAME=documents
```

**Base Technology**: Yjs WebSocket server + Mongoose (for persistence)

**Key Protocol**: Yjs CRDT (Conflict-free Replicated Data Type)
- Real-time synchronization of document updates
- Automatic conflict resolution
- Binary protocol over WebSocket

**Dockerfile Strategy**: Production-optimized with non-root user
```dockerfile
FROM node:22-alpine
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8081
CMD ["npm", "start"]
```

**Volume Mounts**:
- `/app` (bind mount to `./collab/server`) - hot reload
- `/app/node_modules` (anonymous volume)

**WebSocket Connection**:
- URL: `ws://localhost/api/collab/room/{matchToken}`
- Query params: `userId`, `token` (JWT)
- Persists collaborative edits to MongoDB

**Related Files**:
- [`./collab/server/Dockerfile`](./collab/server/Dockerfile)
- [`./collab/server/package.json`](./collab/server/package.json)
- [`./collab/server/src/server.js`](./collab/server/src/server.js)

---

### 6. Chat Service Container

**Purpose**: Real-time messaging during collaboration

**Image**: Node.js 22 Alpine

**Ports**:
- `8082` (WebSocket for chat)

**Environment Variables**:
```bash
CHAT_PORT=8082
```

**Base Technology**: Yjs WebSocket server (message synchronization)

**Key Protocol**: Yjs Y.Array for message persistence
- Messages stored as CRDT array
- Automatic sync across connected clients
- No external database dependency

**Dockerfile Strategy**: Production-optimized with non-root user
```dockerfile
FROM node:22-alpine
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8082
CMD ["node", "server.js"]
```

**Volume Mounts**:
- `/app` (bind mount to `./chat`) - hot reload
- `/app/node_modules` (anonymous volume)

**WebSocket Connection**:
- URL: `ws://localhost/api/chat`
- Query params: `userId`, `token` (JWT)

**Related Files**:
- [`./chat/Dockerfile`](./chat/Dockerfile)
- [`./chat/package.json`](./chat/package.json)
- [`./chat/server.js`](./chat/server.js)

---

### 7. Frontend Container

**Purpose**: React SPA served through nginx

**Image**: Node.js 22 Alpine (development mode)

**Ports**:
- `5173` (Vite dev server)

**Environment Variables**:
```bash
CHOKIDAR_USEPOLLING=true  # Required for Docker hot reload
VITE_API_BASE_URL=/api
```

**Base Technology**: Vite + React 19

**Dockerfile Strategy**: Development with hot reload
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

**Volume Mounts**:
- `/app` (bind mount to `./frontend`) - hot reload
- `/app/node_modules` (anonymous volume)

**Build Output**: 
- In production nginx gateway: `/usr/share/nginx/html` (static files)

**API Proxy Configuration**:
- All requests to `/api` are proxied through nginx gateway
- JWT tokens passed via Authorization header
- Supports WebSocket upgrades for collab and chat

**Related Files**:
- [`./frontend/Dockerfile.dev`](./frontend/Dockerfile.dev)
- [`./frontend/package.json`](./frontend/package.json)
- [`./frontend/vite.config.ts`](./frontend/vite.config.ts)

---

### 8. MongoDB Container

**Purpose**: Primary database for services

**Image**: `mongo:7` (official MongoDB image)

**Ports**:
- `27017` (MongoDB protocol)

**Volumes**:
- `mongo-data` (named volume) - persistent data storage

**Collections**:
- `users` - User authentication data
- `questions` - Coding problems
- `question_attempts` - User attempt history
- `documents` - Yjs collaborative document states

**Startup Command**: Default MongoDB server

**Related Files**:
- `docker-compose.yml` (service definition)

---

### 9. Redis Container

**Purpose**: In-memory cache and job queue backend

**Image**: `redis:7-alpine` (official Redis image)

**Ports**:
- `6379` (Redis protocol)

**Configuration**:
```bash
command: redis-server --appendonly no --save ""
```
- Disables persistence (AOF off, RDB snapshots off)
- Suitable for ephemeral queue data

**Used By**:
- Matching Service: BullMQ job queue
- Collab Service: Optional caching

**Related Files**:
- `docker-compose.yml` (service definition)

---

## API Documentation

### Base Configuration

All API requests go through the nginx gateway at port 80. The gateway routes requests to internal services:

```
Request: http://localhost/api/auth/sign-in
         ↓
Nginx: Proxies to http://auth-service:8000
         ↓
Response: JWT token
```

### Request/Response Pattern

**Authentication Header**:
```bash
Authorization: Bearer <JWT_TOKEN>
```

**API Response Format**:
```json
{
  "data": { /* response payload */ },
  "error": null
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Server error

### Authentication API

**Sign Up**
```
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response (201):
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Sign In**
```
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**JWT Verification** (Internal, called by nginx)
```
POST /api/jwt/verify-jwt
Authorization: Bearer <TOKEN>

Response (200):
{
  "valid": true,
  "userId": "user_123"
}
```

**JWKS Endpoint** (For token verification)
```
GET /api/auth/jwks

Response (200):
{
  "keys": [
    {
      "alg": "HS256",
      "kty": "oct",
      "kid": "key_id",
      "k": "base64_encoded_key"
    }
  ]
}
```

### User Profile API

**Get Profile**
```
GET /api/users/{userId}/profile
Authorization: Bearer <TOKEN>

Response (200):
{
  "data": {
    "userId": "user_123",
    "username": "johndoe",
    "email": "user@example.com",
    "biography": "Software engineer interested in DSA",
    "handles": {
      "leetcode": "johndoe_lc",
      "github": "johndoe"
    },
    "problemsSolved": 150,
    "joinDate": "2024-01-15T10:30:00Z"
  }
}
```

**Update Profile**
```
PUT /api/users/{userId}/profile
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "username": "johndoe_updated",
  "biography": "Updated bio",
  "handles": {
    "leetcode": "johndoe_lc_v2",
    "codeforces": "johndoe_cf"
  }
}

Response (200):
{
  "data": { /* updated profile */ }
}
```

### Questions API

**Get Random Question**
```
POST /api/questions/question/random
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "categories": ["arrays", "strings"],
  "difficulty": "medium"
}

Response (200):
{
  "data": {
    "id": "q_abc123",
    "title": "Two Sum",
    "description": "Given an array of integers...",
    "complexity": "O(n)",
    "categories": ["arrays", "hash-table"],
    "difficulty": "easy",
    "examples": [
      {
        "input": "[2,7,11,15], target = 9",
        "output": "[0,1]"
      }
    ]
  }
}
```

**Get Question by ID**
```
GET /api/questions/question/{questionId}
Authorization: Bearer <TOKEN>

Response (200):
{
  "data": { /* full question object */ }
}
```

**Get User's Question Attempts**
```
GET /api/questions/question/attempt/{userId}
Authorization: Bearer <TOKEN>

Response (200):
{
  "data": [
    {
      "id": "attempt_123",
      "userId": "user_123",
      "questionId": "q_abc123",
      "submittedCode": "...",
      "result": "accepted",
      "submittedAt": "2024-11-12T15:30:00Z"
    }
  ]
}
```

**Submit Question Attempt**
```
POST /api/questions/question/attempt
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "user_123",
  "questionId": "q_abc123",
  "code": "...",
  "language": "javascript"
}

Response (201):
{
  "data": {
    "id": "attempt_123",
    "result": "accepted"
  }
}
```

### Matching API

**Start Queue**
```
POST /api/matching/queue
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "user_123",
  "topic": "arrays",
  "difficulty": "medium"
}

Response (200):
{
  "data": {
    "queueId": "queue_456",
    "status": "queued",
    "createdAt": "2024-11-12T15:30:00Z"
  }
}
```

**Queue Events (Server-Sent Events)**
```
GET /api/matching/queue-events/{userId}?token={JWT_TOKEN}

Response: Event stream
event: match_found
data: {
  "matchId": "match_789",
  "opponentId": "user_456",
  "questionId": "q_abc123",
  "matchToken": "token_xyz"
}
```

**Accept Match**
```
POST /api/matching/matches
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": "user_123",
  "matchId": "match_789"
}

Response (200):
{
  "data": {
    "status": "accepted",
    "sessionToken": "token_xyz"
  }
}
```

**Leave Queue**
```
DELETE /api/matching/queue/{userId}
Authorization: Bearer <TOKEN>

Response (204): No content
```

**Check Match Status**
```
GET /api/matching/matches/{matchToken}/status?token={JWT_TOKEN}

Response (200):
{
  "data": {
    "status": "in_match",
    "participants": ["user_123", "user_456"],
    "questionId": "q_abc123"
  }
}
```

### Collaboration API

**WebSocket Connection**
```
Protocol: WebSocket
URL: ws://localhost/api/collab/room/{matchToken}
Query Params:
  - userId: User identifier
  - token: JWT token

Upgrade Headers:
  Connection: upgrade
  Upgrade: websocket

Message Protocol: Yjs CRDT (binary)
```

**Message Flow**:
1. Client connects to WebSocket
2. Server sends initial document state
3. Client sends local edits as Yjs deltas
4. Server broadcasts deltas to other connected clients
5. All clients maintain consistent document via CRDT merge

**Example JavaScript**:
```javascript
const wsUrl = `ws://localhost/api/collab/room/${matchToken}?userId=${userId}&token=${jwtToken}`;
const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
  // Binary Yjs delta
  const delta = new Uint8Array(event.data);
  ydoc.transact(() => {
    Y.applyUpdate(ydoc, delta);
  });
};

ydoc.on('update', (update) => {
  ws.send(update);
});
```

### Chat API

**WebSocket Connection**
```
Protocol: WebSocket
URL: ws://localhost/api/chat
Query Params:
  - userId: User identifier
  - token: JWT token

Message Protocol: Yjs Y.Array with message objects
```

**Message Format**:
```json
{
  "userId": "user_123",
  "username": "johndoe",
  "text": "What's your approach?",
  "timestamp": "2024-11-12T15:35:00Z"
}
```

**Example JavaScript**:
```javascript
const yarray = ydoc.getArray('messages');

// Add message
yarray.push([{
  userId: 'user_123',
  username: 'johndoe',
  text: 'Hello!',
  timestamp: new Date().toISOString()
}]);

// Listen for new messages
yarray.observe((event) => {
  event.changes.added.forEach((item) => {
    console.log('New message:', item.content.getContent());
  });
});
```

---

## Design Choices

### 1. Microservices Architecture with Nginx Gateway

**Rationale**:
- **Service Isolation**: Each microservice has independent deployment, scaling, and technology choices
- **Loose Coupling**: Services communicate through HTTP/WebSocket, not shared databases
- **Technology Diversity**: Auth uses TypeScript, Matching uses Node.js with BullMQ, etc.
- **Gateway Pattern**: Single entry point (nginx) simplifies routing, security, and logging

**Trade-offs**:
- Network overhead between services vs. modularity
- Operational complexity vs. independent scaling
- Distributed debugging vs. service independence

**Key File**: [`./nginx-gateway/config/nginx.conf`](./nginx-gateway/config/nginx.conf)

---

### 2. Container Runtime Optimization

**Development vs. Production**:

| Aspect | Development | Production |
|--------|-------------|-----------|
| Base Image | Alpine (smaller) | Alpine (smaller) |
| Node version | node:22-alpine | node:22-alpine |
| Nodemon | Included | Excluded |
| Source Mounts | Bind mount (/app) | COPY (built-in) |
| User | root (default) | node (non-root) |
| CMD | npm run dev | npm start |

**Security Features**:
- **Non-root User** (collab, chat, matching): Prevents container escape
- **Directory Ownership** (`chown -R node:node`): Ensures user can write
- **Layer Caching**: `COPY package*.json` before source code

**Example (Matching Service)**:
```dockerfile
FROM node:22-alpine
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
USER node  # Switch to non-root
RUN npm install
COPY --chown=node:node . .
EXPOSE 3001
CMD ["npm", "run", "dev"]
```

---

### 3. Multi-Stage Build for Nginx Gateway

**Why Two Stages?**

```
Stage 1 (Builder): 
  - Uses node:22-alpine (contains npm, node)
  - Installs dependencies
  - Runs npm run build
  - Outputs: /app/dist (minified React app)
  
Stage 2 (Runtime):
  - Uses nginx:alpine (lightweight, no Node.js)
  - COPYs only /app/dist from builder
  - Final image: ~40MB (vs ~400MB with node:22)
```

**Benefit**: 
- Reduces final image size by 90%
- Separates build-time and runtime environments
- Security: No build tools (npm, node) in production image

**Dockerfile**:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend ./
RUN npm run build

FROM nginx:alpine
COPY ./nginx-gateway/config/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 4. Real-Time Synchronization with Yjs

**Why Yjs?**

- **CRDT (Conflict-free Replicated Data Type)**: Automatic conflict resolution without server coordination
- **Binary Protocol**: Efficient over WebSocket (vs. JSON)
- **Offline Support**: Clients can work offline and merge changes when reconnected
- **Language-Agnostic**: Works with JavaScript, Python, Rust, etc.

**Applied To**:
- **Collab Service** (Editor): Real-time code editing with simultaneous multi-user support
- **Chat Service** (Messages): Distributed message log with automatic sync

**Alternative Considered**: Operational Transformation (OT)
- Required central server for conflict resolution
- More complex conflict resolution logic
- Yjs simpler for peer-to-peer scenarios

---

### 5. Job Queue for Matching (BullMQ + Redis)

**Why Async Queues for Matching?**

- **Fault Tolerance**: Matching jobs survive service restarts (persisted in Redis)
- **Scalability**: Multiple matching service instances can consume queue jobs
- **Delayed Execution**: Queue supports TTL (time-to-live) for auto-abandon
- **Job Retries**: Failed matches automatically retry

**Architecture**:
```
User → POST /queue → Matching Service adds job to Redis queue
                  ↓
Redis Queue (BullMQ) holds pending match jobs
                  ↓
Matching Worker processes jobs (finds compatible peers)
                  ↓
Match found → Sends SSE notification → User accepts → Session created
```

**Related File**: [`./matching-service/src/server.js`](./matching-service/src/server.js)

---

### 6. Docker Compose for Local Development

**Key Design Decision**: Single `docker-compose.yml` for all services

**Advantages**:
- One command to spin up entire stack: `docker-compose up`
- Services auto-discover each other via DNS
- Volume mounts enable hot reload
- Matches production architecture (services in containers)

**Volume Strategy**:

```yaml
volumes:
  - ./auth-service:/app           # Bind mount for hot reload
  - /app/node_modules             # Anonymous volume (isolated)
```

**Why separate volumes?**
- Bind mount (`./auth-service:/app`): Live code changes reflect in container
- Anonymous volume (`/app/node_modules`): Linux-specific modules (node_modules)
- Prevents Windows/Mac node_modules issues

---

### 7. Environment Variable Management

**Development (.env file)**:
```bash
DB_LOCAL_URI=mongodb://mongo:27017  # Container DNS
REDIS_HOST=redis                     # Container DNS
AUTH_SERVICE_TARGET=http://auth-service:8000
```

**Container Service Discovery**:
- Services reference each other by container name
- Docker DNS (127.0.0.11:53) resolves names within the network
- Example: `http://auth-service:8000` → resolved to auth-service container IP

**Secrets (Not checked into git)**:
- `.env` contains sensitive credentials (DB URI, JWT secret)
- Should be added to `.gitignore`
- In production: Use environment secrets manager (AWS Secrets Manager, HashiCorp Vault)

---

### 8. Network Isolation

**Custom Bridge Network** (`leetcode_collab_net`):
- All containers connected to same network
- Services communicate via container DNS
- External access only through exposed ports (80, 5173, etc.)

**Port Mapping**:
```yaml
ports:
  - "80:80"      # Host:Container
  - "5173:5173"  # Only frontend exposed for dev
  - "8000:8000"  # Auth service for debugging
```

**Why not use default bridge?**
- Default bridge has no automatic DNS
- Custom bridge enables DNS service discovery
- Better network isolation

---

## Runbooks

### Running the Application

#### 1. Full Stack with Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d

# Expected output:
# auth-service-dev       | Server running on port 8000
# question-service-dev   | Server running on port 3013
# matching-service-dev   | Server running on port 3001
# collab-service-dev     | Listening on port 8081
# chat-service-dev       | Listening on port 8082
# nginx-gateway-dev      | nginx ready, listening on port 80
```

**Access Points**:
- Frontend: `http://localhost:5173` (direct) or `http://localhost:80` (via nginx)
- API: `http://localhost/api/*` (through nginx)
- Nginx logs: `./logs/nginx/access.log` (JSON format)

#### 2. Selective Service Startup

```bash
# Start only backend services (skip frontend)
docker-compose up auth-service question-service matching-service \
                collab-service chat-service mongo redis

# Start frontend development separately
cd frontend
npm install
npm run dev

# This allows faster iteration on frontend code without container rebuild
```

#### 3. Development Workflow with Hot Reload

```bash
# Terminal 1: Start containers
docker-compose up

# Terminal 2: Make code changes
# Edit ./auth-service/src/server.ts

# Terminal 1 shows: 
# auth-service-dev | [nodemon] restarting due to changes
# Nodemon automatically restarts the service
```

**Why hot reload works**:
- Bind mounts source code into container (`-v ./auth-service:/app`)
- Services run with nodemon/ts-node (watches file changes)
- No container rebuild needed

---

### Monitoring and Debugging

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 50 lines
docker-compose logs --tail=50 question-service

# Follow with timestamps
docker-compose logs -f --timestamps auth-service
```

**Log Format**:
```
auth-service-dev | Server running on port 8000
nginx-gateway-dev | "GET /api/auth/jwks HTTP/1.1" 200 500
question-service-dev | Connected to MongoDB
```

#### Inspect Container Networking

```bash
# List all containers and their IPs
docker-compose ps

# Get container IP address
docker inspect $(docker-compose ps -q auth-service) | grep IPAddress

# Test DNS resolution inside container
docker-compose exec auth-service nslookup mongo

# Test connection between services
docker-compose exec auth-service curl http://question-service:3013/
```

#### Interactive Shell Access

```bash
# Access auth-service shell
docker-compose exec auth-service sh

# Check environment variables
docker-compose exec auth-service env | grep DB

# View installed packages
docker-compose exec auth-service npm list

# Check file permissions
docker-compose exec chat-service ls -la /home/node/app
```

---

### Building and Publishing Images

#### Build All Images

```bash
# Build without starting containers
docker-compose build

# Build specific service
docker-compose build auth-service

# Build with no cache (force rebuild)
docker-compose build --no-cache nginx-gateway
```

#### Tag and Push to Registry

```bash
# Tag image for registry
docker tag peerprep_nginx-gateway:latest myregistry.azurecr.io/peerprep/nginx-gateway:latest

# Push to Azure Container Registry
docker push myregistry.azurecr.io/peerprep/nginx-gateway:latest

# Create registry secret in Kubernetes
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password>
```

#### Multi-Platform Build (ARM64 for Apple Silicon)

```bash
# Enable buildx for multi-platform builds
docker buildx create --name mybuilder

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myregistry.azurecr.io/peerprep/auth-service:latest \
  -f ./auth-service/Dockerfile.dev \
  ./auth-service
```

---

### Database Management

#### MongoDB Operations

```bash
# Access MongoDB shell
docker-compose exec mongo mongosh

# In mongosh:
> use PeerPrepAuthDB
> db.users.find().pretty()
> db.questions.count()

# Backup database
docker-compose exec mongo mongodump --out /backup

# Restore database
docker-compose exec mongo mongorestore /backup
```

#### Clear MongoDB Data

```bash
# Remove mongo-data volume (deletes all data)
docker-compose down -v

# Or keep containers but flush database
docker-compose exec mongo mongosh --eval "db.dropDatabase()"
```

---

### Performance Optimization

#### 1. Reduce Image Size

```bash
# Check image sizes
docker images

# Output:
# peerprep_nginx-gateway        latest    40MB
# peerprep_auth-service         latest    180MB  (can optimize)
```

**Optimization for auth-service**:
```dockerfile
# Current: node:22-alpine
# Reduce to:
FROM node:22-alpine

# Multi-stage build
FROM node:22-alpine AS builder
RUN npm install --production

FROM node:22-alpine
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

#### 2. Improve Build Speed

```bash
# Use Docker BuildKit for better caching
DOCKER_BUILDKIT=1 docker-compose build

# Parallelize builds
docker-compose build --parallel
```

#### 3. Monitor Resource Usage

```bash
# See CPU/memory usage
docker stats

# Limit resources in docker-compose.yml
services:
  auth-service:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

### Troubleshooting

#### Service fails to start

```bash
# Check logs
docker-compose logs auth-service

# Look for:
# - Port already in use
# - Database connection errors
# - Missing environment variables

# Check if port is available
lsof -i :8000
```

#### Network connectivity issues

```bash
# Test DNS resolution
docker-compose exec auth-service nslookup mongo

# Ping another service
docker-compose exec auth-service ping -c 1 question-service

# Check routing table
docker-compose exec auth-service route

# Verify network
docker network inspect $(docker-compose ps -q auth-service)
```

#### MongoDB connection refused

```bash
# Ensure mongo service is up
docker-compose ps | grep mongo

# Check mongo logs
docker-compose logs mongo

# Test connection
docker-compose exec auth-service curl http://mongo:27017

# Check MongoDB status in shell
docker-compose exec mongo mongosh --eval "db.runCommand('ping')"
```

#### Hot reload not working

```bash
# 1. Check bind mounts
docker inspect $(docker-compose ps -q auth-service) | grep -A 5 Mounts

# 2. Verify file ownership
docker-compose exec auth-service ls -la /app

# 3. Restart service
docker-compose restart auth-service

# 4. On Windows/Mac: Enable polling
# In docker-compose.yml:
environment:
  - CHOKIDAR_USEPOLLING=true
```

#### WebSocket connection fails

```bash
# Check nginx configuration
docker-compose exec nginx-gateway cat /etc/nginx/nginx.conf | grep -A 10 "Upgrade"

# Test WebSocket endpoint
docker-compose exec nginx-gateway curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:80/api/collab/room/test

# Check collab-service logs
docker-compose logs -f collab-service
```

---

### Migration to Kubernetes

#### Prerequisites

- Kubernetes cluster (Minikube for local, EKS/AKS for cloud)
- kubectl configured
- Docker images pushed to registry

#### Quick Start with Kubernetes

```bash
# Use provided script
chmod +x k8s-quick-start.sh
./k8s-quick-start.sh

# Or manual steps:

# 1. Create namespace
kubectl create namespace leetcode-collab

# 2. Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/question-service.yaml
kubectl apply -f k8s/matching-service.yaml
kubectl apply -f k8s/collab-service.yaml
kubectl apply -f k8s/nginx-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify deployment
kubectl get pods -n leetcode-collab
kubectl get svc -n leetcode-collab

# 4. Access application
kubectl port-forward svc/nginx-gateway 80:80 -n leetcode-collab
# Visit http://localhost:80
```

#### Key Kubernetes Files

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | Create isolated namespace |
| `k8s/mongo.yaml` | MongoDB StatefulSet + PVC |
| `k8s/redis.yaml` | Redis Deployment |
| `k8s/auth-service.yaml` | Auth Deployment + Service |
| `k8s/ingress.yaml` | Expose services to external traffic |

**Resource Configuration Example**:
```yaml
containers:
  - name: auth-service
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "2Gi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 10
      periodSeconds: 5
```

---

### Common Workflows

#### Testing Authentication Flow

```bash
# 1. Start services
docker-compose up

# 2. Register user
curl -X POST http://localhost/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# 3. Sign in
curl -X POST http://localhost/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq '.data.token' -r > token.txt

# 4. Test protected endpoint
curl -X GET http://localhost/api/users/user_123/profile \
  -H "Authorization: Bearer $(cat token.txt)"
```

#### Testing Real-Time Features

**Collab Editor**:
```bash
# Terminal 1: Start containers
docker-compose up

# Terminal 2: Connect to WebSocket
wscat -c "ws://localhost/api/collab/room/test_token?userId=user1&token=$(cat token.txt)"

# Terminal 3: Connect second client
wscat -c "ws://localhost/api/collab/room/test_token?userId=user2&token=$(cat token.txt)"

# In either terminal: Type updates and see them in the other
```

**Matching Queue**:
```bash
# 1. Start queue events stream (Terminal 1)
curl -N "http://localhost/api/matching/queue-events/user1?token=$(cat token.txt)"

# 2. Join queue from another terminal
curl -X POST http://localhost/api/matching/queue \
  -H "Authorization: Bearer $(cat token.txt)" \
  -d '{
    "userId": "user1",
    "topic": "arrays",
    "difficulty": "medium"
  }'

# Watch for match_found event in Terminal 1
```

---

### Performance Benchmarking

#### Load Testing

```bash
# Install Apache Bench
# brew install httpd

# Test API endpoint
ab -n 1000 -c 10 http://localhost/api/questions/question/random

# Results:
# Requests per second: 150
# Failed requests: 0
# Longest response: 200ms
```

#### WebSocket Load Testing

```bash
# Use websocket-bench
npm install -g websocket-bench

websocket-bench autobahn \
  -c ws://localhost/api/collab/room/test
```

---

## Conclusion

PeerPrep's containerized microservices architecture provides:

1. **Modularity**: Independent service deployment and scaling
2. **Resilience**: Container restarts, health checks, job queues
3. **Developer Experience**: Hot reload, easy debugging, single command startup
4. **Production Ready**: Multi-stage builds, non-root users, Kubernetes support
5. **Real-Time Features**: WebSocket infrastructure for collaboration and chat

The combination of Docker for development and Kubernetes for production ensures consistency across environments while maintaining the flexibility to scale individual components based on demand.

For additional guidance, see:
- [`./k8s/guides/k8s_local_guide.md`](./k8s/guides/k8s_local_guide.md)
- [`./auth-service/README.md`](./auth-service/README.md)
- [`./frontend/README.md`](./frontend/README.md)
