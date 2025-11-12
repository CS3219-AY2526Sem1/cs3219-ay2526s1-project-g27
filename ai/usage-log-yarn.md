# AI Usage Log

## Date/Time:
2025-09-12 01:24
## Tool:
ChatGPT(GPT-5)
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
ChatGPT(GPT-5)
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
ChatGPT(GPT-5)
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
ChatGPT(GPT-5)
## Prompt/Command:
Generate the docker compose file for the server and client

## Output Summary:
Template code for 
- `collab/docker-compose.yml`

Additionally, it also generated instructions for running docker-compose

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
Verified by running the code


## Date/Time:
2025-10-2 23:11
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
\<Copy and pasted ./server/utils.js code here\>
Create a persistence adapter for mongodb

## Output Summary:
Code for 
- `collab/server/persistence.js`

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code

## Date/Time:
2025-10-4 02:11
## Tool:
ChatGPT(GPT-5)
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
ChatGPT(GPT-5)
## Prompt/Command:
App.tsx
\<Copy and pasted ./collab/client/App.tsx\>

editor.tsx
\<Copy and pastede ./collab/client/editor.tsx\>
add roomID input field and a connect button to App.tsx and make the editor use the roomID to connect to the specified room

## Output Summary:
Added the buttons and roomID field to editor. Editted editor code to use the roomID to request for a different room

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code


## Date/Time:
2025-10-16 22:00
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
using tailwind, let this component be on the right of a 2-column div (create the div too) \<CollaborativeEditor roomID={matchToken} />

## Output Summary:
HTML elements, styled using tailwind to give the content requested

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by reading code
- Integrated the HTML into `./frontend/src/pages/collab/Session` to give the page basic structure


## Date/Time:
2025-10-20 22:05
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
app.get('/user/status/:userId', (req, res) => { //req.param.userId //get from redis }) 
app.post('/match/start/:jwt', (req, res) => { //req.param.jwt //send to redis })
app.get('/match/status/:jwt', (req, res) => { //req.param.jwt //get from redis }) in redis, the key value stored is {match_id: [user_ids]}. 
Help to fill in the functions. use ioredis

## Output Summary:
IORedis API calls

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code


## Date/Time:
2025‑11‑07 22:10
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
use yjs to create a chat backend server

## Output Summary:
Boilerplate websocket server code for yjs

## Action Taken:
- [] Accepted as-is
- [X] Modified
- [ ] Rejected
## Author Notes:
- Verified by reading code
- Added the relevant functions for our solution, as in `collab/server/src/server.js`
- Very similar to `collab/server/src/server.js`


## Date/Time:
2025‑11‑07 22:16
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
chat widget with yjs 

## Output Summary:
Boilerplate frontend code for a chat widget using yjs

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code


## Date/Time:
2025‑11‑07 22:19
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
include user id

## Output Summary:
Added user id to YJS data, and displayed the user id in the widget

## Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code
- Changed it to display the username instead


## Date/Time:
2025‑11‑07 22:23
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
align self messages to the right

## Output Summary:
Aligned messages that matched the user id to the right

## Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code
- Changed it to match based on user id instead


## Date/Time:
2025‑11‑07 22:28
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
make it scroll down when a new message arrives

## Output Summary:
Added code to allow for the widget to scroll when a new message arrives.
Includes a buffer, above which no scrolling occurs (eg. when you are reading old messages)

## Action Taken:
- [X] Accepted as-is
- [ ] Modified
- [ ] Rejected
## Author Notes:
- Verified by testing code


## Date/Time:
2025‑11‑07 22:28
## Tool:
ChatGPT(GPT-5)
## Prompt/Command:
for this client, write the messaging docs
\<Copy and ./chat/server.js>

## Output Summary:
Added code to allow for the widget to scroll when a new message arrives.
Includes a buffer, above which no scrolling occurs (eg. when you are reading old messages)

## Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
## Author Notes:
- Read and modified for language