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

# Date / Time:
2025-10-13 12:30
# Tool:
ChatGPT 5 
# Prompt/Command:
Currently the match page logic is all here in one file (Copied and pasted code of Match.tsx). However, I want the idea that if the user joins the queue (and has not be removed from the queue by the server), it should still reflect that the user is in the queue and cannot join. This function should be present when user navigate to other pages in my application and then back to it. Moreover, i will want to show the timer of the queue as well at any part of the application, not just in the match page. Can you advise on how to go about doing this implementation and what are the resources/documentations to look into?

# Output Summary:
Recommended files to create and how should the logic be separated. Also provided some backbone code.

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
Followed the recommended files to create and used the backbone of the files (MatchContext.tsx and QueueTimerDisplay.tsx). Tested and works.

# Date / Time:
2025-10-13 12:30
# Tool:
ChatGPT 5 
# Prompt/Command:
I want the QueueDisplayTimer to have a button such that there is a cross and I can invoke a function to remove the user from the queue as user request

# Output Summary:
Recommended UI for the button creation.

# Action Taken:
- [X] Accepted as-is 
- [] Modified
- [ ] Rejected
# Author Notes:
Copied the UI into QueueDisplayTime.tsx and works.

# Date / Time:
2025-10-15 10:00
# Tool:
ChatGPT 5 
# Prompt/Command:
Recheck after lock failure implementation for processJob function.

# Output Summary:
Code adjustments to current processJob function.

# Action Taken:
- [X] Accepted as-is 
- [] Modified
- [ ] Rejected
# Author Notes:
Tested and works.

# Date / Time:
2025-10-26/27
# Tool:
ChatGPT 5 / Claude Sonnet 4.5 / Gemini 2.5 Flash 
# Prompt/Command:
Asked how to synchronize multiple tabs of the same browser to show the same matching page.

# Output Summary:
Code adjustments to MatchContext.tsx file

# Action Taken:
- [X] Accepted as-is 
- [] Modified
- [ ] Rejected
# Author Notes:
Went through many iterations of back and forth asking how to implement and along the way, realised that some edits suggested were the reasons of the bugs spotted. Finally, Claude gave the implementation that tackled the bugs and problems I highlighted.