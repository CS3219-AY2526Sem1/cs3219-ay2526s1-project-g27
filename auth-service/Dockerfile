# Stage 1: The Builder
# This stage installs all dependencies, including devDeps, to build the project
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compile TypeScript to JavaScript, placing it in the /dist folder
RUN npm run build

# Stage 2: The Final Production Image
# Start from a fresh, clean base image
FROM node:22-alpine
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies to keep the image small
RUN npm install --only=production

# Copy the compiled JavaScript code from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 8000

# The command to start the server, running the compiled JavaScript
CMD ["npm", "start"]