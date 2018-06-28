'use strict';

import { logger } from 'lib/logger';
import redis from 'lib/redis';
import Block from 'lib/model/block';
import { txMemPool } from 'lib/txMemPool';
import config from 'config';

async function getBlock(blockNumber) {
  try {
    const block = await redis.getAsync(Buffer.from('block' + blockNumber));
    if (!block)
      throw new Error('Block not found');

    return new Block(block);
  }
  catch(error) {
    logger.info("ERROR" + error.toString());
  }
  return null;
}

async function createNewBlock() {
  // Collect memory pool transactions into the block
  // should be prioritized

  try {
    let lastBlock = await getLastBlockNumberFromDb();
    let newBlockNumber = lastBlock + config.contractblockStep;
  
    let transactions = await txMemPool.txs();
    
    const block = new Block({
      blockNumber: newBlockNumber,
      transactions: transactions
    });

    for (let utxo of block.transactions) {
      let utxoNewKey = "utxo_" + block.blockNumber.toString(10) + "_"+ utxo.token_id.toString(); 

      if (utxo.prev_block != 0) {
        let utxoOldKey = "utxo_"+ utxo.prev_block.toString(10) + "_"+ utxo.token_id.toString();
        await redis.delAsync( utxoOldKey );
      }
      await redis.setAsync( utxoNewKey, utxo.getRlp() );

      //del from pool
      await redis.hdel('txpool', utxo.getHash());
    }

    await redis.setAsync( 'lastBlockNumber', block.blockNumber );
    await redis.setAsync( 'block' + block.blockNumber.toString(10) , block.getRlp() );
          
    logger.info('New block created - transactions: ', block.transactions.length);

    return block;
  } catch(err) {
    logger.error('createNewBlock error ', err);
  }
  //vector<TxPriority> vecPriority;
  //vecPriority.reserve(mempool.mapTx.size());
  //for (map<uint256, CTxMemPoolEntry>::iterator mi = mempool.mapTx.begin();
}

async function getLastBlockNumberFromDb() {
  let lastBlock = await redis.getAsync('lastBlockNumber');

  if (!lastBlock) {
      redis.setAsync('lastBlockNumber', 0);
      lastBlock = 0;
  } else 
    lastBlock = parseInt(lastBlock);
  
  return lastBlock;
}



export { getBlock, createNewBlock, getLastBlockNumberFromDb };
