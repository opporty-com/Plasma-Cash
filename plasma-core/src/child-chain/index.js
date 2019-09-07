/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import p2pEmitter from "./lib/p2p";
import validators from "./lib/validators";
import BlockCreator from "./lib/BlockCreator";
import logger from "./lib/logger";
import contractHandler from '../root-chain/contracts/plasma';
import config from '../config';

import * as Transaction from './controllers/Transaction';
import * as Block from './controllers/Block';
import * as Token from './controllers/Token';


p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.NEW_TX_CREATED, async payload => {
  try {
    await Transaction.add(payload);
  } catch (error) {
    logger.error(error);
  }
});

p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.PREPARE_NEW_BLOCK, async payload => {
  try {
    await Block.validation(payload);
  } catch (error) {
    logger.error(error);
  }
});

p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.NEW_BLOCK_CREATED, async payload => {
  try {
    await Block.add(payload);
  } catch (error) {
    logger.error(error);
  }
});


contractHandler.contract.events.DepositAdded(async (error, event) => {
  if (error)
    return logger.error(error);

  try {
    await Transaction.deposit(event.returnValues);
  } catch (error) {
    logger.error(error);
  }
});

contractHandler.contract.events.BlockSubmitted(async (error, event) => {
  if (error)
    return logger.error(error);

  try {
    await Block.submitted(event.returnValues);
  } catch (error) {
    logger.error(error);
  }

});


if (process.env.IS_SUBBMITTER) {
  const blockCreator = new BlockCreator({
    minTransactionsInBlock: 1,
  });
}


validators.addCandidate(process.env.PLASMA_NODE_ADDRESS);


let prevCountTx = 0, prevCountToken = 0, prevCountPool = 0;
setInterval(async () => {
  const countTx = await Transaction.count();
  const countToken = await Token.count();
  const countPool = await Transaction.getPoolSize();
  const memory = process.memoryUsage().heapUsed / 1024 / 1024;
  const peers = p2pEmitter.getCountPeers();
  logger.info(`Transactions: ${countTx}(${countTx - prevCountTx}) | Pool size: ${countPool}(${countPool - prevCountPool}) | Tokens: ${countToken}(${countToken - prevCountToken}) | Peers: ${peers} | Memory: ${memory}`);

  prevCountTx = countTx;
  prevCountToken = countToken;
  prevCountPool = countPool;

}, 10000);
