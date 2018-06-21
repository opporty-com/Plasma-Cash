'use strict';

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

import Routing from './routing';
const SERVER_PORT = process.env.PORT || 8081;
import BlockCreator from './app/lib/blockCreator';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  BlockCreator.start();
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer(Routing.route).listen(SERVER_PORT);

  console.log(`Worker ${process.pid} started`);
}
