FROM node:10.5.0

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN npm i -g --unsafe-perm truffle@5.0.35 soljitsu
COPY ./app/package.json /usr/src

RUN cd ../ && npm i
