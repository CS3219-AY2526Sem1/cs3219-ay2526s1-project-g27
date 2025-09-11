# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
# Scope: 
# - Generated template Dockerfile
# Author review: 
# - Verfied for correctness by running code

# Use official Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the server code
COPY . .

# Expose the port used by the WebSocket server
EXPOSE 1234

# Start the server
CMD ["node", "server.js"]
