ARG  NODE_VERSION
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY server ./server

EXPOSE 8080
CMD [ "npm", "run", "start" ]
