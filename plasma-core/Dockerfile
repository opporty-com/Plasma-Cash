FROM node:10.16-buster

#RUN apt-get update && apt-get -y install git make gcc g++ python

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app
RUN npm i

COPY .babelrc /usr/src/app/
COPY ./src /usr/src/app/src
COPY ./src/cli/bin /usr/src/app/dist/cli/bin
RUN npm run build

CMD npm run start
