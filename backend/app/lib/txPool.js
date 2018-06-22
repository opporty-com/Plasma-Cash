'use strict';

import Block from 'lib/model/block';
import config from "../../config";
import ethUtil from 'ethereumjs-util'; 
import { logger } from 'lib/logger';
import { getUTXO } from 'lib/tx';
import redis from 'lib/redis';

const { prefixes: { blockPrefix, utxoPrefix } } = config;
const depositPreviousBlockBn = 0;

class TXPool {
  constructor () {
    this.transactions = [];
    this.newBlockNumber;
    this.newBlockNumberBuffer;
    this.inputKeys = {};
  }

  get length() {
    return this.transactions.length;
  }

  async addTransaction(tx) {
    if (!this.newBlockNumber) 
      await this.getLastBlockNumberFromDb();
    
    let isValid = await this.checkTransaction(tx);

    if (!isValid) 
      return false;
    
    this.transactions.push(tx);
    return tx;
  }
  
  async checkTransaction(transaction) {
    try {
      if (!transaction) 
        return false;
      
      if (!transaction.validate) 
        return false;
      
      if (transaction.prev_block == depositPreviousBlockBn) {
        let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase());    
        let valid = address == config.plasmaOperatorAddress.toLowerCase();
        if (!valid) 
          return false;
        
      } else {    

        let utxo = await getUTXO(transaction.prev_block, transaction.token_id);

        if (!utxo) 
          return false;
        
        transaction.prev_hash = utxo.getHash();
        let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase());    
        
        let utxoOwnerAddress = ethUtil.addHexPrefix(utxo.new_owner.toString('hex').toLowerCase());
        if (utxoOwnerAddress != address) 
          return false;

      }
        
      return true;
    }
    catch (error) {
      console.log('checkTransaction error: ', error);
      return false;
    }
  }
  
  async getLastBlockNumberFromDb() {
    let lastBlock = await redis.getAsync('lastBlockNumber');

    if (!lastBlock) {
        redis.setAsync('lastBlockNumber', 0);
        lastBlock = 0;
    }

    this.newBlockNumber = lastBlock + config.contractblockStep;
  }
  
  async createNewBlock() {
    try{
      if (!this.newBlockNumber) 
        await this.getLastBlockNumberFromDb();
      
      let txCount = this.transactions.length;
      let transactions = this.transactions;
      
      if (txCount == 0) 
        return false;
      
      const blockData = {
        blockNumber: this.newBlockNumber,
        transactions: transactions
      };

      const block = new Block(blockData); 

      for (let tx of block.transactions) {
        let utxo = tx;
        utxo.blockNumber = block.blockNumber;
        let utxoRlp = utxo.getRlp();
        let utxoNewKey = utxoPrefix + block.blockNumber.toString(16) + tx.token_id.toString();      
        let utxoOldKey = utxoPrefix + tx.prev_block.toString(16) + tx.token_id.toString();
        
        await redis.delAsync( utxoOldKey );
        await redis.setAsync( utxoNewKey, utxoRlp ); 
        //queryAll.push({ type: 'del', key: utxoOldKeyWithAddress });
        //queryAll.push({ type: 'put', key: utxoNewKeyWithAddress, value: txRlp });
      }
      await redis.setAsync( 'lastBlockNumber', block.blockNumber );
      await redis.setAsync( blockPrefix + block.blockNumber.toString(16) , block.getRlp() );
    
      this.transactions = this.transactions.slice(txCount);
      console.log('      New block created - transactions: ', block.txCount);

      this.newBlockNumber = this.newBlockNumber + config.contractblockStep;
    
      return block;
    }
    catch(err){
      logger.error('createNewBlock error ', err);
    }
  }
};

const txPool = new TXPool();

export default txPool;
