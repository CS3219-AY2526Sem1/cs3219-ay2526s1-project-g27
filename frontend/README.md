# PeerPrep Frontend

A React-based frontend for PeerPrep, a real-time peer programming interview preparation platform. Users can match with peers, collaborate on coding problems, and chat in real-time.

---

## Table of Contents

- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Real-Time Protocols](#real-time-protocols)
- [Design Choices](#design-choices)
- [Error Handling & Edge Cases](#error-handling--edge-cases)
- [Setup and Running](#setup-and-running)
- [Testing](#testing)

---

## Architecture

The PeerPrep frontend is a React (Vite) single-page application (SPA). It consists of:

* **React Components:** A mix of UI components (built with Radix UI and Tailwind CSS) and feature-specific components (e.g., `Editor.tsx`, `Chat.tsx`).
* **Context-Based State:** Uses React Context (`AuthContext`, `MatchContext`) to manage global state for authentication and the matching lifecycle.
* **API Client:** A centralized `axios` client configured in `src/api/apiClient.ts` for all HTTP communication with the backend microservices.
* **Real-Time Clients:** Implements two real-time protocols:
    * **Server-Sent Events (SSE):** For receiving matching status updates (`MatchContext`).
    * **WebSocket (with Yjs):** For collaborative editing and chat (`Editor.tsx`, `Chat.tsx`).
* **Routing:** Handled by React Router, including protected routes that redirect unauthenticated users to the login page.

---

## API Endpoints

The frontend communicates with backend services via a proxy at `/api`.

| Operation | HTTP Request | URI | HTTP Response (on success) |
| :--- | :--- | :--- | :--- |
| Sign In | `POST` | `/auth/sign-in` | **(via Better Auth)** Session + JWT |
| Get User Profile | `GET` | `/users/api/v1/users/{userId}/profile` | `{ data: UserProfile }` |
| Update User Profile | `PUT` | `/users/api/v1/users/{userId}/profile` | `{ data: UserProfile }` |
| Get Question Attempts | `GET` | `/questions/question/attempt/{userId}` | `QuestionAttempt[]` |
| Start Queue | `POST` | `/matching/queue` | User added to queue |
| Leave Queue | `DELETE` | `/matching/queue/{userId}` | User removed from queue |
| Accept Match | `PUT` | `/matching/matches/{matchId}` | Match accepted |
| Check Match Status | `GET` | `/collab/match/status/{matchToken}` | `{ status: 'in_match' \| 'no_match' }` |
| Get Random Question | `POST` | `/questions/question/random` | `{ id, title, description, ... }` |

---

## Real-Time Protocols

### Matching (Server-Sent Events)

The frontend listens for matching-related events via an SSE stream.

| Event Source | URI | Purpose |
| :--- | :--- | :--- |
| Queue Events | `GET /api/matching/queue-events/{userId}` | Provides real-time notifications for match status (e.g., `matchFound`, `matchSuccess`). Handled by `MatchContext`. |

### Collaboration (WebSocket)

Real-time editing and chat are handled via WebSocket connections using the Yjs protocol.

| Protocol | URI | Purpose |
| :--- | :--- | :--- |
| Yjs (WebSocket) | `ws://localhost/api/collab/room/{matchToken}` | Synchronizes code editor state (CRDTs) between peers. |
| Yjs (WebSocket) | `ws://localhost/api/chat` | Synchronizes chat messages (Y.Array) between peers. |

---

## Design Choices

1.  **State Management: Multi-Context Approach**
    * Uses two primary React contexts: `AuthContext` for user/JWT state and `MatchContext` for queue/match state.
    * **Rationale:** This separates concerns effectively for the application's complexity. It avoids the overhead of a larger state management library (like Redux) as state is not deeply nested.

2.  **Matching Coordination: Lead Tab Pattern**
    * To prevent duplicate SSE and WebSocket connections, only one browser tab (the "lead tab") maintains the active real-time connections.
    * Other tabs listen for state changes via the `BroadcastChannel` API and `localStorage` (`storage` events).
    * **Rationale:** This ensures a single source of truth for real-time events, prevents redundant server connections, and gracefully handles tab closures or refreshes by transferring leadership.

3.  **Real-Time Collaboration: Yjs (CRDTs)**
    * Uses **Yjs** over WebSockets for both the collaborative editor (with CodeMirror 6) and the chat.
    * **Rationale:** Yjs is a Conflict-free Replicated Data Type (CRDT) library. It automatically handles merge conflicts without a central authority, which is ideal for a peer-to-peer programming scenario where both users can edit simultaneously.

4.  **Authentication: JWT with Better Auth**
    * The `Better Auth` client handles login/signup, providing a JWT. This JWT is then stored in React state (`AuthContext`) and sent in the `Authorization: Bearer {token}` header for all `axios` API requests.
    * **Rationale:** JWTs are flexible, work well for WebSocket authentication (passed as a query parameter), and are better suited for microservice architectures (compared to stateful cookies) as they can be used across different subdomains.

5.  **Form Validation: Zod + React Hook Form**
    * Uses `Zod` for schema-based validation and `React Hook Form` for efficient, performance-oriented form state management.
    * **Rationale:** This combination provides strong type-safety (inferring types from schemas), excellent TypeScript support, and high performance by minimizing component re-renders during form input.

---

## Error Handling & Edge Cases

1.  **API Errors (401/403)**
    * A global `axios` response interceptor (in `src/api/apiClient.ts`) catches all HTTP errors.
    * It specifically handles 401 (Unauthorized) and 403 (Forbidden) responses, typically by logging the user out. Other errors are displayed to the user via toast notifications (Sonner).

2.  **Multi-Tab Coordination**
    * If the "lead tab" (handling SSE/WebSocket) is closed, the `BroadcastChannel` and `localStorage` mechanism allows another tab to detect the loss of leadership and take over.
    * Matching state is persisted in `localStorage` (`matching-state`) to handle page refreshes without losing queue status.

3.  **React Component Errors**
    * A global React `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) catches rendering errors in the component tree and displays a fallback UI instead of crashing the entire application.

4.  **Unauthenticated Access**
    * A `ProtectedRoute` component (`src/routes/ProtectedRoute.tsx`) wraps all private routes. If a user is not authenticated (checked via `AuthContext`), they are automatically redirected to the `/login` page.

---

## Setup and Running

### Prerequisites

* Node.js 18+
* npm or yarn

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
