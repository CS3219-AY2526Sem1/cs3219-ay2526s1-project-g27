# AI Usage Log Template
file /ai/usage-log.md.

# Date / Time:
2025-9-21 17:50
# Tool:
ChatGPT 5 
# Prompt/Command:
How to setup a service that uses redis, bullmq and bullboard while dockerizing it?

# Output Summary:
- Details project structure for service
- Generated Dockerfile and docker-compose.dev.yml file. 
- Generated sample server.js file to check if the project can setup correctly.

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
- Modified the namings 
- Refactor the environemnt variables into a separate file instead of keeping in docker-compose.dev.yml.
- Edited inputs such that it can be launched

# Date / Time:
2025-9-28 22:00
# Tool:
ChatGPT 5 
# Prompt/Command:
How do I implement Server Side Events such that each user is notified on the events emitted by BullMQ?

# Output Summary:
- Logically listing out how the process should look like
- Sample code on how to create Server Side Events on both client and server

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
- Modified the tracking of a Server Side Event connection with user by adding jobId associated with user in queue
- Proceeded with the suggestion of a class creation called SSEClientConnection with some modifications

# Date / Time:
2025-9-29 15:30
# Tool:
ChatGPT 5
# Prompt/Command:
How does the server side handle accept match? I need 2 users to accept the match then it is considered matched, else i have to put the user back into queue. the user should have roughly 10 seconds to accept.

# Output Summary:
Provided the flow on how should be done with suggested code.

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
- Used the different functions suggested such as finalizeMatch, acceptTentativeMatch, handleTentativeMatch and checkMatchTimeout.
- Utilized the backbone of the logic flow as an inspiration and modified logic as well with incorporation of redis.  

# Date / Time:
2025-9-29 22:35
# Tool:
Gemini 2.5 Flash
# Prompt/Command:
Why is it that when i rerun the container, the redis cache still stores the past data?

# Output Summary:
Modification of docker-compose.dev.yml file is suggested

# Action Taken:
- [X] Accepted as-is 
- [ ] Modified
- [ ] Rejected
# Author Notes:
Followed the recommended solution. Tested and works.

# Date / Time:
2025-10-12 18:00
# Tool:
Gemini 2.5 Flash
# Prompt/Command:
Advise on how i should be breaking up this code into files. (Provided the entire code of server.js file)

# Output Summary:
Recommended File Structure

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
Followed the recommended file structure. Modified to avoid circular dependencies.
