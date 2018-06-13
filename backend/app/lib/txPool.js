'use strict';

import Block from 'lib/model/block';
import config from "../config";
import Web3 from 'web3';
import ethUtil from 'ethereumjs-util'; 
const BN = ethUtil.BN;

import levelDB from 'lib/db';
import { logger } from 'lib/logger';
import { blockNumberLength, tokenIdLength } from 'lib/dataStructureLengths';
import { getUTXO } from 'lib/tx';
const { prefixes: { blockPrefix, utxoPrefix, utxoWithAddressPrefix } } = config;

const depositPreviousBlockBn = new BN(0);

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
    if (!this.newBlockNumber || !this.newBlockNumberBuffer) {
      await this.getLastBlockNumberFromDb();
    }

    let isValid = await this.checkTransaction(tx);

    if (!isValid) {
      return false;
    }
    
    this.transactions.push(tx);
    return tx;
  }
  
  
  async checkTransaction(transaction) {
    try {
      if (!transaction) {
        return false;
      }
      if (!transaction.validate) {
        return false;
      }
      
      if (new BN(transaction.prev_block).eq(depositPreviousBlockBn)) {
        let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase());    
        let valid = address == config.plasmaOperatorAddress.toLowerCase();
        if (!valid) {
          return false;
        }
      } else {      
        let utxo = await getUTXO(transaction.prev_block, transaction.token_id);

        if (!utxo) {
          return false;
        }
        transaction.prev_hash = utxo.getHash();
        let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase());    

        let utxoOwnerAddress = ethUtil.addHexPrefix(utxo.new_owner.toString('hex').toLowerCase());
        if (utxoOwnerAddress != address) {
          console.log('checkTransaction ----------------4 -: ');

          return false;
        }
      }
        
      return true;
    }
    catch (error) {
      console.log('checkTransaction error: ', error);
      return false;
    }
  }
  
  async getLastBlockNumberFromDb() {
    let lastBlock;
    try{
      lastBlock = await levelDB.get('lastBlockNumber');
    }
    catch(error) {
      lastBlock = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(0)), blockNumberLength);
      await levelDB.put('lastBlockNumber', lastBlock);
    }
    let lastBlockNumber = Web3.utils.toBN(ethUtil.addHexPrefix(lastBlock.toString('hex')));
    let newBlockNumber = lastBlockNumber.add(new BN(config.contractblockStep));

    this.newBlockNumber = newBlockNumber;
    this.newBlockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(newBlockNumber), blockNumberLength);
  }
  
  async createNewBlock() {
    try{
      if (!this.newBlockNumber) {
        await this.getLastBlockNumberFromDb();
      }
      
      let txCount = this.transactions.length;
      let transactions = this.transactions;
      
      if (txCount == 0) {
        return false;
      }

      const newBlockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(this.newBlockNumber), blockNumberLength);
      const blockData = {
        blockNumber:  newBlockNumberBuffer,
        transactions: transactions
      }
      const block = new Block(blockData); 

      let queryAll = [
        { type: 'put', key: 'lastBlockNumber', value: block.blockNumber },
        { type: 'put', key: Buffer.concat([blockPrefix, block.blockNumber]), value: block.getRlp() }
      ];
      
      for (let tx of block.transactions) {
        let utxoPrevBlockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(tx.prev_block), blockNumberLength);
        let tokenIdBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(tx.token_id), tokenIdLength)

        let txRlp = tx.getRlp();
        
        let utxoNewKey = Buffer.concat([utxoPrefix, block.blockNumber, tokenIdBuffer]);      
        let utxoOldKey = Buffer.concat([utxoPrefix, utxoPrevBlockNumberBuffer, tokenIdBuffer]);
        
        let utxoNewKeyWithAddress = Buffer.concat([utxoWithAddressPrefix, ethUtil.toBuffer(tx.new_owner), block.blockNumber, tokenIdBuffer]);
        let utxoOldKeyWithAddress = Buffer.concat([utxoWithAddressPrefix, ethUtil.toBuffer(tx.getAddressFromSignature()), utxoPrevBlockNumberBuffer, tokenIdBuffer]);

        queryAll.push({ type: 'del', key: utxoOldKey });
        queryAll.push({ type: 'put', key: utxoNewKey, value: txRlp });
        queryAll.push({ type: 'del', key: utxoOldKeyWithAddress });
        queryAll.push({ type: 'put', key: utxoNewKeyWithAddress, value: txRlp });
      }

      await levelDB.batch(queryAll);
      
      this.transactions = this.transactions.slice(txCount);
      console.log('      New block created - transactions: ', txCount);

      this.newBlockNumber = this.newBlockNumber.add(new BN(config.contractblockStep));
      this.newBlockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(this.newBlockNumber), blockNumberLength);

      return block;
    }
    catch(err){
      logger.error('createNewBlock error ', err);
    }
  }
};

const txPool = new TXPool();

export default txPool;
