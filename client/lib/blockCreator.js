'use strict';

import config from 'config';
import { logger } from 'lib/logger';
import txPool from 'lib/txPool';
import redis from 'lib/redis';
import contractHandler from 'lib/contracts/plasma';
import depositEventHandler from 'lib/handlers/DepositEventHandler';
import web3 from 'lib/web3';
import Block from 'lib/model/block';
import ethUtil from 'ethereumjs-util'; 

class BlockCreator {
  constructor (options = {}) {
    this.options = options || {};
  }

  start() {
    this.initBlockPeriodicalCreation();
    this.startBlockSubmittingToParent();
    this.blockEventsCheck(null);
  }

  async initBlockPeriodicalCreation() {
    let poollen = await txPool.length();
    logger.info('Creating New Block - len ', poollen, 'tx, ', this.options.minTransactionsInBlock);

    if (this.options.minTransactionsInBlock && poollen >= this.options.minTransactionsInBlock) {
        await txPool.createNewBlock();
    }
    
    setTimeout(this.initBlockPeriodicalCreation.bind(this), config.blockPeriod)
    return true;
  }

  async startBlockSubmittingToParent() {
    try {
      let lastBlockInDatabase = await redis.getAsync('lastBlockNumber');
      lastBlockInDatabase = lastBlockInDatabase ? parseInt(lastBlockInDatabase) : 0;
      let lastSubmittedBlock = await redis.getAsync('lastBlockSubmitted');
      lastSubmittedBlock = lastSubmittedBlock ? parseInt(lastSubmittedBlock): 0;

      logger.info('LastBlockInDatabase, LastSubmittedBlock', lastBlockInDatabase, lastSubmittedBlock)
      
      if (lastBlockInDatabase > lastSubmittedBlock) {
        let currentBlockInParent = await contractHandler.contract.methods.current_blk().call();
        if (currentBlockInParent != lastSubmittedBlock) {
          if (currentBlockInParent > lastSubmittedBlock) 
            await redis.setAsync('lastBlockSubmitted', currentBlockInParent);
        } else {
          lastSubmittedBlock += config.contractblockStep;
          this.startBlockSubmit(lastSubmittedBlock);
        }
      }
    } catch(error) {
      logger.error('Submiting block error ', error);
    }
    setTimeout(this.startBlockSubmittingToParent.bind(this), 30000);
  }
  
  async blockEventsCheck(lastCheckedBlock) {
    let lastBlock;
    if (lastCheckedBlock == null) {
      lastCheckedBlock = await redis.getAsync('lastEventProcessed');
      lastCheckedBlock = lastCheckedBlock ? parseInt(lastCheckedBlock) : 0;
    }
    try {
      lastBlock = await web3.eth.getBlockNumber();
      if (lastBlock > lastCheckedBlock) {
        lastCheckedBlock++;

        logger.info('Process Block for Deposit Events - ', lastBlock);

        const depositEventsInBlock = await contractHandler.contract.getPastEvents("DepositAdded", {
          fromBlock: lastCheckedBlock,
          toBlock: lastBlock
        });

        if (depositEventsInBlock.length > 0) {
          for (let i = 0, length = depositEventsInBlock.length; i < length; ++i)
            depositEventHandler(depositEventsInBlock[i]);
        }
        redis.setAsync('lastEventProcessed', lastBlock);
      }
    } catch(error) {
      logger.error("blockEventsCheck error " + error);
      lastBlock = lastCheckedBlock;
    }
    setTimeout(() => this.blockEventsCheck(lastBlock), 5000);
  }

  async startBlockSubmit(blockNumber) {
    let blockKey = 'block' + blockNumber.toString(16);
    let block = new Block(await redis.getAsync(Buffer.from(blockKey)));
    let blockMerkleRootHash = ethUtil.addHexPrefix(block.merkleRootHash.toString('hex'));
    let submittedBlockNumber = ethUtil.bufferToInt(blockNumber);

    await web3.eth.personal.unlockAccount(config.plasmaOperatorAddress, config.plasmaOperatorPassword, 60);

    logger.info('Block submit #', submittedBlockNumber, blockMerkleRootHash);
    let gas = await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submittedBlockNumber).estimateGas({from: config.plasmaOperatorAddress});
    await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submittedBlockNumber).send({from: config.plasmaOperatorAddress, gas});
    logger.info('Submitted block #', blockNumber);

    redis.setAsync('lastBlockSubmitted', blockNumber);
  }
}

const blockCreator = new BlockCreator({
  minTransactionsInBlock: 5
});

export default blockCreator;
