'use strict'

import web3 from 'lib/web3'
import http from 'http'
import BlockCreator from 'child-chain/blockCreator'
import Routing from 'routing'
import logger from 'lib/logger'
import {dpt} from 'lib/p2p'
import config from 'config'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const port = process.env.PORT || 30313;

(async () => {
  try {
    if (!config.bootNode) {
      await sleep(5000)
    }
    await web3.eth.net.isListening()
    BlockCreator.start()

    http.createServer(Routing.route).listen(port, (err) => {
      if (err) {
        return
      }
      logger.info('HTTP started at: http://127.0.0.1:' + port)
    })

    dpt.on('error', (err) => logger.error(err))


  } catch (e) {
    logger.error('Web3 instance is not available'+ e )
    logger.info('BYE')
    process.exit()
  }
})()
