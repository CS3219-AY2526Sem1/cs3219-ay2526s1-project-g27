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

