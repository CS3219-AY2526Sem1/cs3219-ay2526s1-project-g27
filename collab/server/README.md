
# Introduction and  Attribution
- Simple backend for yjs, referenced from the [y-websocket github repo](https://github.com/yjs/y-websocket).
- Uses `express` to allow this single server to service both API endpoints and websocket endpoints


## API Endpoints

| Operation | HTTP Request | URI | HTTP Response |
|-----------|--------------|-----|----------------|
| Retrieve the status of the user | GET | `/user/status/:userId` | **200:** JSON data with `{ status: 'in_match' \| 'idle', matchToken }` depending on whether the user is in a match <br> **500:** Internal server error, failed to get user status |
| Start match with ID = `matchToken` | POST | `/match/start/:matchToken` | **200:** JSON data with `{ success: true, matchToken: matchToken }` Match successfully started <br>**400:** Invalid match token, failed to start match <br>**500:** Internal server error, failed to start match |
| Retrieve the status of the match with ID = `matchToken` | GET | `/match/status/:matchToken` | **200:** JSON data with `{ status: 'in_match' \| 'no_match', matchToken: matchToken }` depending on whether the match is in progrees <br> **500:** Internal server error, failed to get match status |
| End match with ID = `matchToken` | POST | `/match/stop/:matchToken` | JSON data with `{ success: true, matchToken: matchToken }` Match successfully ended <br> **500:** Internal server error, failed to end match |

## Websocket Messaging

**YJS Events**
Default YJS event are retained and can be referenced from the [y-websocket github repo](https://github.com/yjs/y-websocket).

**Custom Events**
| Message | Purpose |
|-----------|---------------|
| partnerAfk | Notifies that the connected partner has not sent any changes to the document for a period of time (default 60s) |
| partnerAlive | Notifies that the previously AFK partner has resumed editing |
| partnerRejoin | Notifies that the connected partner has left the match (closed their WebSocket connection) |
| lastUser | Notifies the remaining client that they are the only user left in the room |

## License

[The MIT License](./LICENSE) © Kevin Jahns
