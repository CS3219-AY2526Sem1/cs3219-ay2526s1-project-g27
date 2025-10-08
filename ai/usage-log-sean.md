# AI Usage Log Template
file /ai/usage-log.md.

# Date/Time:
YYYY-MM-DD HH:MM
# Tool:
(e.g., ChatGPT, GitHub Copilot)
# Prompt/Command:
(copy the main prompt or describe the request)
# Output Summary:
(short summary of what the AI produced)
# Action Taken:
- [ ] Accepted as-is
- [ ] Modified
- [ ] Rejected
# Author Notes:
(what you changed, why, and how you verified correctness)


# Date / Time:
2025-9-14 23:50
# Tool:
ChatGPT 5 
# Prompt/Command:
How can I setup a node.js with express backend with betterauth and mongodb. 

# Output Summary:
Basically the folder structure and what to do to set it up 

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected
# Author Notes:
Vulnerability in node-20 alpine, adjusting information to the boiler plate as I go along

# Date / Time:
2025-9-19 22:00
# Tool: 
ChatGPT 5 / Gemini 2.5 Pro
# Prompt/ Command:
How can i set up a bare-bounds frontend using vite with a file structure meant for production as well as incorporate docker for mongodb

# Output Summary
File structure for frontend, Setup for vite - react with tailwind , instructions to do so


# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modified using Shadcn components, and made tweaks so that the frontend works for us and docker-compose remove legacy version config.
Set up Auth according to BetterAuth Quick Start Guide 


# Date / Time:
25-9-2025 to 8-10-2025
# Tool:
ChatGPT 5 / Claude Sonnet 4.5 / Gemini Pro 2.5

# Prompt / Command / Description:
For this span of time, i was roughly working on the Auth-service which saw me use Claude, ChatGPT , GeminiPro 2.5 to structure the folder to look more like a MVC backend and sometihng that is closer to a professional production. 
It was also used in the sense to debug all type errors and errors that pop up that was used for unfamiliarity
I also used it to generate the email template as well as make changes to the code as necessary, both type wise or any functionality improvement.

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
For any changes using AI, I do make slight adjustments since often the code might produce some error with just wholesale since it doesn't adjust to all of the code context ( My strategy is just copy and pasting code into the llm and see the type of intuition and structure it generates) . 
For certain folders like `AuthMiddleware.ts` i might copy wholesale the boiler plate code. Otherwise, there are edits to make it , either in the opinion that the way the code was written by AI was not of a production level or good structure or making some custom adjustment so it fits other folders. 
