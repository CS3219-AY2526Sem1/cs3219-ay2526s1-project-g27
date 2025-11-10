# ==================================
#         STAGE 1: BUILDER
# ==================================
# This stage compiles the TypeScript to JavaScript
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including typescript, etc.)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build command (defined in package.json) to compile the code
# This will create a 'dist' folder with the resulting JavaScript
RUN npm run build


# ==================================
#        STAGE 2: PRODUCTION
# ==================================
# This is the final, lean image that will be deployed
FROM node:22-alpine

WORKDIR /app

# Copy package files again
COPY package*.json ./

# Install ONLY the production dependencies. This makes the image smaller.
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 8000

# The command to run the compiled JavaScript file directly with node.
# This is highly memory-efficient.
CMD [ "node", "dist/server.js" ]
