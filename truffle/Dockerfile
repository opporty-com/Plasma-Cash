FROM node:latest

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY ./app/package.json /usr/src

RUN cd ../ && npm i && npm i -g truffle && npm i -g soljitsu
