'use strict';

import config from 'config';
import { logger } from 'lib/logger';
import txPool from 'lib/txPool';
import redis from 'lib/redis';
import contractHandler from 'lib/contracts/plasma';
import depositEventHandler from 'lib/handlers/DepositEventHandler';
import web3 from 'lib/web3';
import Block from 'lib/model/block';

const ethUtil = require('ethereumjs-util'); 
const BN = ethUtil.BN;
const plasmaOperatorAddress = config.plasmaOperatorAddress;

class BlockCreator {
  constructor (options = {}) {
    this.options = options || {};
  }

  start() {
    this.initBlockPeriodicalCreation();
    this.startBlockSubmittingToParent();
    this.startCheckingContractForEvents();
  }
    
  async startCheckingContractForEvents() {
    let lastEventProcessed = await redis.getAsync('lastEventProcessed');
    if (lastEventProcessed)
      lastEventProcessed = parseInt(lastEventProcessed); 
    else 
      lastEventProcessed = 0;

    this.processPeriodicalBlockEventsCheck(lastEventProcessed);
  }
  
  async initBlockPeriodicalCreation() {
    if (this.options.minTransactionsInBlock && txPool.transactions.length >= this.options.minTransactionsInBlock) {
        await txPool.createNewBlock();
    }
    
    setTimeout(() => this.initBlockPeriodicalCreation(), config.blockCreationPeriod)
    return true;
  }
  
  async processPeriodicalBlockEventsCheck(lastCheckedBlock) {
    try{
      let lastblock = await web3.eth.getBlockNumber();

      if (lastblock > lastCheckedBlock) {
        lastCheckedBlock = lastCheckedBlock + 1;
        await this.processBlock(lastCheckedBlock, lastblock);
        setTimeout(() => this.processPeriodicalBlockEventsCheck(lastblock), 5000);
        return;
      } else {
        setTimeout(() => this.processPeriodicalBlockEventsCheck(lastblock), 5000);
        return;
      }
    }
    catch(error) {
      logger.error("processPeriodicalBlockEventsCheck error " + error);
      setTimeout(() => this.processPeriodicalBlockEventsCheck(lastCheckedBlock), 5000);
    }
  }
    
  async processBlock(lastCheckedBlock, lastBlock) {
    const depositEventsInBlock = await contractHandler.contract.getPastEvents("DepositAdded", {
      fromBlock: lastCheckedBlock,
      toBlock: lastBlock
    });

    if (depositEventsInBlock.length > 0) {
      for (let i = 0, length = depositEventsInBlock.length; i< length; i++){
        await depositEventHandler(depositEventsInBlock[i]);
      }
    }

    await redis.setAsync('lastEventProcessed', lastBlock);
  } 

  async startBlockSubmittingToParent() {
    try {
      let lastBlockInDatabase = await redis.getAsync('lastBlockNumber');
      
      lastBlockInDatabase = lastBlockInDatabase ? parseInt(lastBlockInDatabase) : 0 ;
     
      let lastSubmittedBlock = await redis.getAsync('lastBlockSubmitted');
      lastSubmittedBlock = lastSubmittedBlock ? parseInt(lastSubmittedBlock): 0;

      console.log('lastBlockInDatabase lastSubmittedBlock', lastBlockInDatabase, lastSubmittedBlock)
      
      if (lastBlockInDatabase <= lastSubmittedBlock) 
          return setTimeout(() => this.startBlockSubmittingToParent(), 10000);
      
      let currentBlockInParent = await contractHandler.contract.methods.current_blk().call();
      currentBlockInParent = currentBlockInParent;
      if (currentBlockInParent != lastSubmittedBlock) {
        if (currentBlockInParent > lastSubmittedBlock) 
          await redis.setAsync('lastBlockSubmitted', currentBlockInParent);
        
        return setTimeout(() => this.startBlockSubmittingToParent(), 10000);
      }

      lastSubmittedBlock = lastSubmittedBlock + config.contractblockStep;
      await this.startBlockSubmit(lastSubmittedBlock);
    }
    catch(error) {
      if (!error.notFound) 
        logger.error('submiting block error ', error);
      
    }
    setTimeout(() => this.startBlockSubmittingToParent(), 10000);
  }
  
  async startBlockSubmit(blockNumber) {
    let blockKey = config.prefixes.blockPrefix + blockNumber.toString(16);
    let blockBin = await redis.getAsync(new Buffer(blockKey));
    let block = new Block(blockBin);
    let blockMerkleRootHash = ethUtil.addHexPrefix(block.merkleRootHash.toString('hex'));
    let submittedBlockNumber = ethUtil.bufferToInt(blockNumber);
    
    await web3.eth.personal.unlockAccount(plasmaOperatorAddress, config.plasmaOperatorPassword, 60);
    
    console.log('block submit - ', submittedBlockNumber, blockMerkleRootHash);
    let gas = await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submittedBlockNumber).estimateGas({from: plasmaOperatorAddress});

    await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submittedBlockNumber).send({from: plasmaOperatorAddress, gas});
    logger.info('Submitted block - ', blockNumber.toString());

    await redis.setAsync('lastBlockSubmitted', blockNumber);
  } 
}

const blockCreator = new BlockCreator({
  minTransactionsInBlock: 2
});

export default blockCreator;