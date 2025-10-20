# FROM node:22-alpine

# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# WORKDIR /home/node/app
# COPY package*.json ./
# USER node
# RUN npm install
# COPY --chown=node:node . .
# EXPOSE 8081
# CMD [ "npm", "start" ]

FROM node:22-alpine

# As root, create the application directory AND set its ownership to the node user.
# This ensures the 'node' user can write to it later.
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

# Set the working directory for subsequent commands.
WORKDIR /home/node/app

# Copy package files and ensure they are owned by the node user.
COPY --chown=node:node package*.json ./

# Now, switch to the non-root user for security.
USER node

# Run npm install as the 'node' user. This will succeed because the user
# owns the current directory ('/home/node/app').
RUN npm install

# Copy the rest of your application code.
COPY --chown=node:node . .

EXPOSE 8081

CMD [ "npm", "start" ]