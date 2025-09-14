FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dev build
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Prod build
FROM base AS prod
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
