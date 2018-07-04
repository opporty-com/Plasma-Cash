FROM node:10.5.0

RUN apt-get update && apt-get -y install git make gcc g++ python

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/

RUN cd ../ && npm i && npm i -g nodemon && npm i -g babel-cli
