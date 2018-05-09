FROM node:slim

RUN apt-get update && apt-get -y install graphicsmagick git make gcc g++ python

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/

RUN cd ../ && npm i && npm i -g nodemon && npm i -g babel-cli
