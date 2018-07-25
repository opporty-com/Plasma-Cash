'use strict';

import web3 from 'lib/web3';
import http from 'http';
import BlockCreator from 'lib/blockCreator';
import Routing from './routing';
import { logger } from 'lib/logger';

const port = process.env.PORT || 8081;

(async () => {
  try {
    await web3.eth.net.isListening();

      BlockCreator.start();
      http.createServer(Routing.route).listen(port);
      logger.info('Worker', process.pid, ' started, web3 is connected');
    
  } catch (e) {
    logger.error('Web3 instance is not available');
    logger.info('BYE');
    process.exit();
  }  
})();


