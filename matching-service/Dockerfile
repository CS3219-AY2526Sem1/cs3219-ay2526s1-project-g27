# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5) date: 2025-9-21
# Scope: 
# - Generated Dockerfile code
# Author review: 
# - Verfied for correctness by running Docker

FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json ./
RUN npm install --production=false

# Copy source
COPY . .

# Expose port
EXPOSE 3001

# Default command 
CMD ["npm", "run", "dev"]
