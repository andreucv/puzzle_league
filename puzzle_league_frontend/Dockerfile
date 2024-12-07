FROM ubuntu:24.04

WORKDIR /workspace/puzzle_league_frontend

# We need to copy now the package.json to install dependencies
# After that, all the files will be mounted with docker-compose volumes
# Dockerfile being in the same folder as package.json is necessary 
# (it easies the development of the DevContainer config)
COPY package.json .

RUN apt-get update && apt-get install -y npm
RUN npx playwright install
RUN npx playwright install-deps
RUN npm install --loglevel verbose
