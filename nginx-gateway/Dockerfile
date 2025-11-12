# /*
# AI Assistance Disclosure:
# Tool: ChatGPT (model: GPT‑5), Claude 4.5 Sonnet 
# Scope: 
# - Generated Docker file for development
# Author review: 
# - Verify through running 
# */

# --- Stage 1: Build the React App ---
# Use a Node.js image to build our frontend assets
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY ./frontend ./

# Build the application for production
RUN npm run build


# --- Stage 2: Set up the Nginx Server ---
# Use the official Nginx image as our base
FROM nginx:alpine

# Copy our custom Nginx configuration
COPY ./nginx-gateway/config/nginx.conf /etc/nginx/nginx.conf

# Clean up the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built static files from the 'builder' stage
# This is the key part! The files are now owned by the container's root user.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]