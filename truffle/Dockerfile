FROM node:10.5.0

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY ./app/package.json /usr/src

RUN cd ../ && npm i && npm i -g truffle@4.1.14 && npm i -g soljitsu
