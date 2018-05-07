'use strict';

import config from "../config";
const { prefixes: { blockPrefix, transactionPrefix, utxoPrefix, lastBlockSubmittedToParentPrefix } } = config;
import { logger } from 'lib/logger';

const utxoIncludingAddressPrefix = config.utxoIncludingAddressPrefix;
const blockCreationPeriod = config.blockCreationPeriod;

import txPool from 'lib/txPool';
import levelDB from 'lib/db';
import contractHandler from 'lib/contracts/plasma';
import depositEventHandler from 'lib/handlers/DepositEventHandler';

import { blockNumberLength } from 'lib/dataStructureLengths';

const Web3 = require('web3');
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
    
  startCheckingContractForEvents() {
    let lastBlock;
    let lastProcessedBlock;
    let lastCheckedBlock;

    return levelDB.get(config.prefixes.lastEventProcessedBlockPrefix)
      .then((res) => {
        lastCheckedBlock = Web3.utils.toBN(ethUtil.addHexPrefix(res.toString('hex'))).toNumber();
        console.log('Start Checking Contract For Events', lastCheckedBlock);
        this.processPeriodicalBlockEventsCheck(lastCheckedBlock);
      })
      .catch((err) => {
        logger.error('Periodical Events Check err', err);
        lastCheckedBlock = 0;
        this.processPeriodicalBlockEventsCheck(lastCheckedBlock);
    });
  }
  
  

  
  async initBlockPeriodicalCreation() {
    if (!(this.options.minTransactionsInBlock && txPool.transactions.length < this.options.minTransactionsInBlock)) {
      let newBlock = await txPool.createNewBlock();
    }
    
    setTimeout(() => this.initBlockPeriodicalCreation(), blockCreationPeriod)
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
    
    const blockNumberBN = Web3.utils.toBN(lastBlock);
    const newBlockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(blockNumberBN), blockNumberLength);
    await levelDB.put(config.prefixes.lastEventProcessedBlockPrefix, newBlockNumberBuffer);
  } 

  async startBlockSubmittingToParent() {
    try {    
      let lastBlockInDatabase;
      try{
        lastBlockInDatabase = await levelDB.get('lastBlockNumber');
      }
      catch(error) {
        lastBlockInDatabase = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(0)), blockNumberLength);
        await levelDB.put('lastBlockNumber', lastBlockInDatabase);
      }
      lastBlockInDatabase = Web3.utils.toBN(ethUtil.addHexPrefix(lastBlockInDatabase.toString('hex')));

      let lastSubmittedBlock;
      try {
        lastSubmittedBlock = await levelDB.get(lastBlockSubmittedToParentPrefix);
      }  catch(error) {
        lastSubmittedBlock = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(0)), blockNumberLength);
      }
      lastSubmittedBlock = Web3.utils.toBN(ethUtil.addHexPrefix(lastSubmittedBlock.toString('hex')));

      if (!lastBlockInDatabase.gt(lastSubmittedBlock)) {
        return setTimeout(() => this.startBlockSubmittingToParent(), 10000);
      }
      
      let currentBlockInParent = await contractHandler.contract.methods.current_blk().call();
      currentBlockInParent = Web3.utils.toBN(currentBlockInParent);
      if (!currentBlockInParent.eq(lastSubmittedBlock)) {
        if (currentBlockInParent.gt(lastSubmittedBlock)) {
          let lastSubmittedBlockBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(currentBlockInParent), blockNumberLength);
          await levelDB.put(lastBlockSubmittedToParentPrefix, lastSubmittedBlockBuffer);
        }
        return setTimeout(() => this.startBlockSubmittingToParent(), 10000);
      }

      lastSubmittedBlock = lastSubmittedBlock.add(new BN(config.contractblockStep));
      
      await this.startBlockSubmit(lastSubmittedBlock);

      setTimeout(() => this.startBlockSubmittingToParent(), 10000);
    }
    catch(error) {
      if (!error.notFound) {
        logger.error('submiting block error ', error);
      }
      setTimeout(() => this.startBlockSubmittingToParent(), 10000);
    }
  }
  
  async startBlockSubmit(blockNumber) {
    let blockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(blockNumber)), blockNumberLength);
    let blockKey = Buffer.concat([blockPrefix, blockNumberBuffer]);
    let blockBin = await levelDB.get(blockKey);
    let block = new Block(blockBin);
    let blockMerkleRootHash = ethUtil.addHexPrefix(block.merkleRootHash.toString('hex'));
    let submitedBlockNumber = ethUtil.bufferToInt(blockNumber);
    
    await web3.eth.personal.unlockAccount(plasmaOperatorAddress, config.plasmaOperatorPassword, 60);
    let gas = await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submitedBlockNumber).estimateGas({from: plasmaOperatorAddress});

    let res = await contractHandler.contract.methods.submitBlock(blockMerkleRootHash, submitedBlockNumber).send({from: plasmaOperatorAddress, gas});
    logger.info('Submitetd block ', blockNumber.toString());

    await levelDB.put(lastBlockSubmittedToParentPrefix, blockNumberBuffer);
  } 
}

const blockCreator = new BlockCreator;

export default blockCreator;