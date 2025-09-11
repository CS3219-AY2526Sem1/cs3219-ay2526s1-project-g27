# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
# Scope: 
# - Generated template code
# Author review: 
# - Verfied for correctness by running code

# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve the built files with nginx
FROM nginx:alpine

# Copy build output to nginx public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
