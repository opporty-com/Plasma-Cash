'use strict';

import cluster from 'cluster';
import web3 from 'lib/web3';
import http from 'http';
import BlockCreator from 'lib/blockCreator';
import Routing from './routing';
import { logger } from 'lib/logger';

let numCPUs = require('os').cpus().length;
const port = process.env.PORT || 8081;

(async () => {
  try {
    await web3.eth.net.isListening();

    if (cluster.isMaster) {
      logger.info('Master ', process.pid, ' is running - starting block creator...');
      BlockCreator.start();

      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
        
      cluster.on('exit', (worker) => {
        logger.info('Worker ${worker.process.pid} died');
      });
    } else {
      http.createServer(Routing.route).listen(port);
    
      logger.info('Worker', process.pid, ' started, web3 is connected');
    }
  } catch (e) {
    logger.error('Web3 instance is not available');
    logger.info('BYE');
    process.exit();
  }  
})();


