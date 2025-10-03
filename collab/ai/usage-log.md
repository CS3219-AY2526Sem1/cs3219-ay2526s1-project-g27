# AI Usage Log

## Date/Time:
2025-09-12 01:24
## Tool:
ChatGPT
## Prompt/Command:
create a template project for a yjs-codemirror application, with persistence on the serverside

## Output Summary:
Template code for 
- `client/package.json`
- `client/src/editor.tsx`
- `client/src/App.tsx`

Additionally, it also generated instructions for project setup

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Did not use package.json file
- Verified by reading code


## Date/Time:
2025-09-12 01:36
## Tool:
ChatGPT
## Prompt/Command:
Use docker to create a container for the server

## Output Summary:
Template code for 
- `server/package.json`
- `server/Dockerfile`

Additionally, it also generated instructions for running the containers

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Did not use package.json file
- Edited y-websocket version number.  Verified by running the code

## Date/Time:
2025-09-12 01:43
## Tool:
ChatGPT
## Prompt/Command:
Use docker to create a container for the client

## Output Summary:
Template code for 
- `client/Dockerfile`

Additionally, it also generated instructions for running the containers

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
Verified by running the code

## Date/Time:
2025-09-12 01:49
## Tool:
ChatGPT
## Prompt/Command:
Generate the docker compose file for the server and client

## Output Summary:
Template code for 
- `docker-compose.yml`

Additionally, it also generated instructions for running docker-compose

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
Verified by running the code


## Date/Time:
2025-09-13 18:11
## Tool:
ChatGPT
## Prompt/Command:
setup a simple websocket server with YJS as a CRDT to simply receive and emit changes to clients

## Output Summary:
Template code for 
- `server/server.js`

Additionally, it also generated instructions for project setup

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code


## Date/Time:
2025-10-2 23:11
## Tool:
ChatGPT
## Prompt/Command:
\<Copy and pasted ./server/utils.js code here\>
Create a persistence adapter for mongodb

## Output Summary:
Code for 
- `server/persistence.js`

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code

## Date/Time:
2025-10-4 02:11
## Tool:
ChatGPT
## Prompt/Command:
/** setupWSConnection 
 \* conn, req, \{ docName = (req.url || '').slice(1).split('?')\[0], gc = true
 */
wss.on('connection', setupWSConnection(conn, req))
print the number of connections when client connects/disconnect

## Output Summary:
Expanded the above callback to include logging

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code

## Date/Time:
2025-10-4 03:00
## Tool:
ChatGPT
## Prompt/Command:
App.tsx
\<Copy and pasted ./client/App.tsx\>

editor.tsx
\<Copy and pastede ./client/editor.tsx\>
add roomID input field and a connect button to App.tsx and make the editor use the roomID to connect to the specified room

## Output Summary:
Added the buttons and roomID field to editor. Editted editor code to use the roomID to request for a different room

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code