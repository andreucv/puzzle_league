FROM node:22-alpine

WORKDIR /puzzle_league_frontend

# We need to copy now the package.json to install dependencies
# After that, all the files will be mounted with docker-compose volumes
# Dockerfile being in the same folder as package.json is necessary 
# (it easies the development of the DevContainer config)
COPY package.json .

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh


RUN chown -R node:node /puzzle_league_frontend
USER node

RUN npm install --loglevel verbose
