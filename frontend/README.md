# PeerPrep Frontend

A React-based frontend for PeerPrep, a real-time peer programming interview preparation platform. Users can match with peers, collaborate on coding problems, and chat in real-time.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Design Choices](#design-choices)
- [Runbooks](#runbooks)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm lint
```

The app runs on `http://localhost:5173` and proxies API requests to the backend via nginx on `localhost:80`.

## Project Structure

```
src/
├── api/              # API client configuration
├── components/       # React components (UI + features)
├── context/          # React Context providers (Auth, Matching)
├── lib/              # Utilities and helpers
├── pages/            # Page components
├── routes/           # Route definitions
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## API Documentation

### Base Configuration

The frontend uses [axios](https://axios-http.com/) for HTTP requests. The API client is configured in [`src/api/apiClient.ts`](src/api/apiClient.ts) with:

- **Base URL**: `/api` (proxied through nginx to backend services)
- **Timeout**: 10 seconds
- **Credentials**: Disabled (JWT tokens passed in Authorization header)

```typescript
// Example API call
import apiClient from '@/api/apiClient';

const response = await apiClient.get('/users/api/v1/users/123/profile');
```

### Authentication

**Endpoint**: `POST /auth/sign-in` (via Better Auth)

The authentication system uses [Better Auth](https://better-auth.com/) with JWT plugin. See [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) for implementation.

```typescript
// Login example
const result = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123'
});

if (!result.error) {
  const jwtToken = await fetchJwtToken();
}
```

**Token Management**: 
- JWT tokens are stored in state and automatically added to all API requests via the `Authorization` header
- Token refresh is triggered on app load and after signup/login

### User Profile API

**Get Profile**
```
GET /users/api/v1/users/{userId}/profile
Response: { data: UserProfile }
```

**Update Profile**
```
PUT /users/api/v1/users/{userId}/profile
Body: { username?, biography?, handles?, problemsSolved? }
Response: { data: UserProfile }
```

**Get Question Attempts**
```
GET /questions/question/attempt/{userId}
Response: QuestionAttempt[]
```

See [`src/pages/Profile.tsx`](src/pages/Profile.tsx) for usage examples.

### Matching API

**Start Queue**
```
POST /matching/queue
Body: { userId, topic, difficulty }
```

**Queue Events (Server-Sent Events)**
```
GET /api/matching/queue-events/{userId}?token={jwtToken}
```

Real-time event stream for match notifications. Implementation in [`src/context/MatchContext.tsx`](src/context/MatchContext.tsx).

**Accept Match**
```
POST /matching/matches
Body: { userId, matchId }
```

**Leave Queue**
```
DELETE /matching/queue/{userId}
```

**Check Match Status**
```
GET /collab/match/status/{matchToken}?token={jwtToken}
Response: { status: 'in_match' | 'no_match' }
```

### Collaboration API

**Collaborative Editing**
```
WebSocket: ws://localhost/api/collab/room/{matchToken}
Params: { userId, token }
Protocol: Yjs (CRDT-based real-time sync)
```

See [`src/components/collab/Editor.tsx`](src/components/collab/Editor.tsx) for implementation.

**Chat**
```
WebSocket: ws://localhost/api/chat
Params: { userId, token }
Protocol: Yjs Y.Array for message sync
```

See [`src/components/chat/Chat.tsx`](src/components/chat/Chat.tsx) for usage.

### Questions API

**Get Random Question**
```
POST /questions/question/random
Body: { categories: string[], difficulty: string }
Response: { id, title, description, complexity, categories }
```

Used in [`src/context/MatchContext.tsx`](src/context/MatchContext.tsx) to verify question availability before matching.

### Error Handling

The API client includes a response interceptor in [`src/api/apiClient.ts`](src/api/apiClient.ts) that:

- Logs all HTTP errors
- Handles 401 (Unauthorized) and 403 (Forbidden) responses
- Provides meaningful error messages to users via toast notifications

## Design Choices

### 1. State Management Architecture

**Multi-Context Approach**
- [`AuthContext`](src/context/AuthContext.tsx): Handles user authentication and JWT token lifecycle
- [`MatchContext`](src/context/MatchContext.tsx): Manages matching state, queue status, and match lifecycle

**Rationale**: Separates concerns and makes state predictable. Context is sufficient for this app's needs (no deep nesting, moderate state complexity).

### 2. Matching System - Lead Tab Pattern

The matching system uses a **lead tab pattern** to coordinate multiple browser tabs:

- Only one tab (the "lead") maintains the SSE connection to the queue
- Other tabs listen via `BroadcastChannel` API for state sync
- Lead tab detects disconnection via heartbeat and transfers leadership to other tabs

**Key Files**: [`src/context/MatchContext.tsx`](src/context/MatchContext.tsx)

**Why this pattern?**
- Prevents duplicate queue connections
- Ensures only one active WebSocket to backend
- Gracefully handles tab closing/refresh

**State Persistence**:
- Matching state stored in localStorage with key `matching-state`
- Lead tab info stored with key `matching-lead-tab`
- State synced across tabs via `storage` events and `BroadcastChannel`

### 3. Real-Time Collaboration

**Technologies**:
- **Yjs**: CRDT library for conflict-free collaborative editing
- **WebSocket**: Direct bidirectional communication
- **CodeMirror 6**: Editor with Yjs bindings for live code sync

**Design Decision**: 
Chose Yjs because it handles merge conflicts automatically without a central authority, ideal for peer programming where both users edit simultaneously.

See [`src/components/collab/Editor.tsx`](src/components/collab/Editor.tsx) and [`src/components/chat/Chat.tsx`](src/components/chat/Chat.tsx).

### 4. Authentication Flow

**JWT-Based with Better Auth**

1. User logs in → Better Auth returns session + JWT
2. JWT is extracted and stored in React state
3. All API requests include `Authorization: Bearer {token}` header
4. Token is refreshed on app load via [`fetchJwtToken()`](src/context/AuthContext.tsx)

**Why JWT over cookies?**
- Works across different subdomains (future-proof for microservices)
- Explicit token management for WebSocket auth
- Better CORS handling

### 5. Component Architecture

**UI Components**: 
Located in [`src/components/ui/`](src/components/ui/) - built with Radix UI primitives and Tailwind CSS for accessibility and consistency.

**Feature Components**:
- [`Editor.tsx`](src/components/collab/Editor.tsx): Collaborative code editor
- [`Chat.tsx`](src/components/chat/Chat.tsx): Real-time chat widget
- [`LoginForm.tsx`](src/components/LoginForm.tsx) & [`RegisterForm.tsx`](src/components/RegisterForm.tsx): Auth forms with Zod validation
- [`QueueTimerDisplay.tsx`](src/components/QueueTimerDisplay.tsx): Matching queue timer

**Rationale**: Separation of concerns, reusability, and testability.

### 6. Form Validation

**Zod + React Hook Form**

Uses [Zod](https://zod.dev/) for schema validation and [React Hook Form](https://react-hook-form.com/) for efficient form state management.

Example from [`src/components/LoginForm.tsx`](src/components/LoginForm.tsx):

```typescript
const formSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});
```

**Why Zod?** Type-safe, zero dependencies, great TypeScript support.

### 7. Error Handling

**Global Error Boundary**: [`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx)
- Catches React component errors and displays fallback UI

**Protected Routes**: [`src/routes/ProtectedRoute.tsx`](src/routes/ProtectedRoute.tsx)
- Redirects unauthenticated users to login

**Toast Notifications**: Uses [Sonner](https://sonner.emilkowal.ski/) for user feedback

## Runbooks

### Running the Application

#### Development Mode

```bash
npm install
npm run dev
```

**Expected Output**:
```
  VITE v7.1.2  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Access the app at `http://localhost:5173`.

#### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` folder. Serve with:

```bash
npm run preview
```

#### Linting

```bash
npm run lint
```

Checks TypeScript and ESLint rules. Configuration in [`eslint.config.js`](eslint.config.js).

### Docker Development

```bash
docker-compose -f docker-compose.dev.yml up
```

The container runs the dev server on `http://localhost:5173` with hot-reload enabled.

See [`Dockerfile.dev`](Dockerfile.dev) and [`docker-compose.dev.yml`](docker-compose.dev.yml).

### Troubleshooting

#### API Requests Failing

1. **Check nginx proxy**: Ensure the backend gateway is running on `localhost:80`
2. **Check environment**: Verify `VITE_BETTER_AUTH_URL` in `.env`
3. **Check token**: Inspect browser DevTools → Network → Request headers for `Authorization` header

#### WebSocket Connection Issues

1. **Check WebSocket endpoint**: Should be `ws://localhost/api/collab/room` or `ws://localhost/api/chat`
2. **Check credentials**: Pass `token` query parameter for authentication
3. **Check connection status**: See [`src/components/collab/Editor.tsx`](src/components/collab/Editor.tsx) for connection state management

#### Multi-Tab Issues

1. **Check localStorage**: Inspect `matching-state` and `matching-lead-tab` keys
2. **Check BroadcastChannel**: Open two tabs and verify communication via console logs
3. **Reset state**: Clear localStorage and refresh

```javascript
// Browser console
localStorage.removeItem('matching-state');
localStorage.removeItem('matching-lead-tab');
```

#### Build Failures

1. **Clear cache**: `rm -rf node_modules .vite`
2. **Reinstall**: `npm install`
3. **Check Node version**: Requires Node 18+

### Monitoring & Debugging

#### Enable Verbose Logging

Most components log to console. Check DevTools Console for:
- API requests: `[API Request]` prefixed logs
- Matching events: `✅`, `⚠️`, `🔗` emoji prefixes
- SSE events: `[SSE]` prefixed logs
- WebSocket: `WebSocket` messages

#### Browser DevTools

- **Network Tab**: Monitor API requests, WebSocket connections
- **Application Tab**: Inspect localStorage, sessionStorage
- **Console**: View logs and errors

### Common Workflows

#### Testing Authentication Flow

1. Navigate to `/register` and create account
2. Verify email confirmation requirement
3. Navigate to `/login` and sign in
4. Verify redirect to `/` (home page)
5. Check localStorage for `better-auth.*` keys

#### Testing Matching Flow

1. Login as two users (use incognito windows)
2. Both click "Match" on matching page
3. Select same topic and difficulty
4. First to accept → both redirected to `/collab`
5. Check editor and chat are synced

#### Testing Collaboration

1. Complete matching flow (above)
2. Edit code in editor → verify both see changes in real-time
3. Type in chat → verify message appears for both users
4. Disconnect one user → verify error state on other user

### Performance Optimization Tips

- **Code Splitting**: Routes lazy-loaded via React Router
- **Bundle Analysis**: Run `npm run build` and check `dist/` size
- **WebSocket Optimization**: Yjs automatically compresses deltas over WebSocket
- **State Updates**: Use `useCallback` to prevent unnecessary re-renders (see [`Editor.tsx`](src/components/collab/Editor.tsx))
