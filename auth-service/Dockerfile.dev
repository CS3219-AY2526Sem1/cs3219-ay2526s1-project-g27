# Use the official Node.js image as a base
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files to leverage Docker's build cache
COPY package*.json ./

# Install all dependencies, including devDependencies like nodemon and ts-node
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# The command to start the development server
CMD ["npm", "run", "dev"]