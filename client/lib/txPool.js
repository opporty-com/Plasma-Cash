'use strict';

import Block from 'lib/model/block';
import config from "config";
import ethUtil from 'ethereumjs-util'; 
import { logger } from 'lib/logger';
import { getUTXO } from 'lib/tx';
import redis from 'lib/redis';
import { PlasmaTransaction } from 'lib/model/tx';

const { prefixes: { blockPrefix, utxoPrefix } } = config;
const depositPreviousBlockBn = 0;

class TXPool {
  constructor () {
    this.newBlockNumber;
    this.newBlockNumberBuffer;
    this.inputKeys = {};
  }

  async length() {
    return await redis.llenAsync('txs');
  }

  async addTransaction(tx) {
    if (!this.newBlockNumber) 
      await this.getLastBlockNumberFromDb();
    
    let isValid = await this.checkTransaction(tx);

    if (!isValid) 
      return false;
    
    await redis.rpushAsync('txs', tx.getRlp(false));
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
    } else {
      lastBlock = parseInt(lastBlock);
    }

    this.newBlockNumber = lastBlock + config.contractblockStep;
  }

  async createNewBlock() {
    try{
      if (!this.newBlockNumber) 
        await this.getLastBlockNumberFromDb();
      
      let txCount = await this.length();
      
      let transactions = await redis.lrangeAsync(new Buffer('txs'), 0, txCount);
      transactions = transactions.map(function(el) {
        return new PlasmaTransaction(el);
      })
      
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
        let utxoNewKey = utxoPrefix + "_" + block.blockNumber.toString(16) + "_"+ tx.token_id.toString(); 
        let utxoOldKey;
        if (tx.prev_block instanceof Buffer) {
           utxoOldKey = utxoPrefix + "_"+ tx.prev_block.toString("hex") + "_"+ tx.token_id.toString();
        }  else     
           utxoOldKey = utxoPrefix + "_"+ tx.prev_block.toString(16) + "_"+ tx.token_id.toString();
        console.log('del async', utxoOldKey);
        await redis.delAsync( utxoOldKey );
        await redis.setAsync( utxoNewKey, utxoRlp );
      }
      await redis.setAsync( 'lastBlockNumber', block.blockNumber );
      await redis.setAsync( blockPrefix + block.blockNumber.toString(16) , block.getRlp() );
      
      for (let i=0; i<txCount; i++) {
        await redis.lsetAsync('txs' , i, 'DELETED');
      }
      await redis.lremAsync('txs', 0, 'DELETED');
      
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
