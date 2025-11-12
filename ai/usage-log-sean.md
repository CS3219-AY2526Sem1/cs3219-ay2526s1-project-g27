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

For the Resend part, i adapted it from the idea of a youtube video featuring resend and betterauth tutorial.



# Date / Time:
16-10-2025
# Tool:
Gemini Pro 2.5

# Prompt / Command / Description:
Decide that we need a API gateway to proxy request to auth service  verify that a json web token is valid and possed about a user.
Ask Gemini to generate code for such a gateway using express and docker configuration file given.



# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:



# Date / Time:
25-9-2025 to 8-10-2025
# Tool:
ChatGPT 5 / Claude Sonnet 4.5 / Gemini Pro 2.5

# Prompt / Command / Description:
Asked for Ngnix configuration instead since gateway showing alot of problems, its basically trying to build a reverse proxy from scratch. So idea is we can simplify it and use existing open source solution

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modifying it to tailor to our own service and settings. This include adding to SSE and adding authorization headers.
Decided to also host react on the ngnix and serve it instead of separating out.


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

For the Resend part, i adapted it from the idea of a youtube video featuring resend and betterauth tutorial.



# Date / Time:
16-10-2025
# Tool:
Gemini Pro 2.5

# Prompt / Command / Description:
Asked about how we could prevent the need for revalidation by every service to verify that a json web token is valid and possed about a user.
Then decide to accept a gateway approach. 
Ask Gemini to generate code for such a gateway using express and docker using nginx.



# Action Taken:
- [] Accepted as-is 
- [] Modified
- [X] Rejected

# Author Notes:
The overall Gateway was buggy and full of errors like dealing with headers and CORS issue. Choose NGINX which is a more commonly use open source solution.


# Date / Time:
25-9-2025 to 8-10-2025
# Tool:
ChatGPT 5 / Claude Sonnet 4.5 / Gemini Pro 2.5

# Prompt / Command / Description:
Asked for Ngnix configuration instead since gateway showing alot of problems, its basically trying to build a reverse proxy from scratch. So idea is we can simplify it and use existing open source solution

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modifying it to tailor to our own service and settings. This include adding to SSE and adding authorization headers.
Decided to also host react on the ngnix and serve it instead of separating out.

# Date / Time
10-10-2025
# Tool:
Gemini Pro 2.5 and Claude Sonnet 4.5

# Prompt / Command / Description:
Given the Better Auth Documentation, how can i set up JSON Web Token for verification.


# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Make route amendments and ensure that the proxy in NGINX matches 


# Date / Time
7-11-2025  to 9-11-2025
# Tool:
Gemini Pro 2.5 and Claude Sonnet 4.5

# Prompt / Command / Description:
Given the nginx config and docker-compose, write me the kubernetes config files for those. We specifically use a leetcode collab, so we need sticky session for matching / collab service since they are using web sockets and like stateful sets for any relevant data apps


# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modified to use own files, changed some settings like memory etc


# Date / Time
10-11-2025
# Tool:
Gemini Pro 2.5 and Claude Sonnet 4.5

# Prompt / Command / Description:
Change the API endpoints based on the DB schema change myself

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modified to use own DB and types.



# Date / Time
9-11-2025
# Tool:
Gemini Pro 2.5 and Claude Sonnet 4.5

# Prompt / Command / Description:
Create a profile page that allows us to communicate with user-service endpoint directly

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modified to ensure correct endpoint usages



# Date / Time
7-11-2025  to 9-11-2025
# Tool:
Gemini Pro 2.5 and Claude Sonnet 4.5

# Prompt / Command / Description:
Given the nginx config and docker-compose, write me the kubernetes config files for those. We specifically use a leetcode collab, so we need sticky session for matching / collab service since they are using web sockets and like stateful sets for any relevant data apps


# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Modified to use own files, changed some settings like memory etc
REMOVED from use. Decide to not pursue this NTH

# Date / Time
13-11-2025
# Tool:
Claude Sonnet 4.5

# Prompt / Command / Description:
Given the code files , and the format I have shown of how to write a README.md and also the design choices and architecture from this given text, generate me the README.md for this file. (Iterated on this )

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
It was not correct and hallucinated some DB schema points. Verified it and made appropriate changes. But it pops out a README.md template backbone. For architecture and design choices, made sure it was edited.


# Date / Time
13-11-2025
# Tool:
Claude Sonnet 4.5

# Prompt / Command / Description:
Using the `nginx.conf` and the architecture decisions and design from our project slides and project, generate the README.md according to the same format as `insert format README.md`

# Action Taken:
- [] Accepted as-is 
- [X] Modified
- [ ] Rejected

# Author Notes:
Edied and remove architecture decision and design that is not credited us.
Heavy vetted as such but took the other methods and read over it.


