
import { createSignedTransaction } from 'lib/tx';
import web3 from 'lib/web3';
import Promise from 'bluebird';

import config from "../config";
const ethUtil = require('ethereumjs-util'); 
import RLP from 'rlp';

import txPool from 'lib/txPool';


import { getAllUtxos } from 'lib/tx';

let statistic = {}
let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70'.toLowerCase(),
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed'.toLowerCase(), 
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe'.toLowerCase(),
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7'.toLowerCase(),
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'.toLowerCase()
];

class TestTransactionsCreator {
  constructor (options = {}) {
    this.ready = false;
    this.utxos = [];
    
    this.nextAddressGen = getNextAddress(accounts);
    this.nextAddressGen.next();
    this.blockCreatePromise = Promise.resolve(true);
  }
  
  async init() {
    try {
      for (let address of accounts) {
        await web3.eth.personal.unlockAccount(address, config.plasmaOperatorPassword, 0);
        console.log('Unlock account: ', address);
        this.ready = true
      }
    }
    catch (err) {
      this.ready = false;
    }
  }
  
  async createNewTransactions(count = 0) {
    if (!this.ready) { return false }
    
    if (this.blockCreateInProgress) {
      try {
        await this.blockCreatePromise;
      }
      catch (err) {
        console.log('err', err);
      }
    }
    
    let utxo = await this.getNextUtxo();
    if (!utxo) {
      return false;
    }
    

    let txData = {
      prev_hash:  utxo.getHash().toString('hex'),
      prev_block: utxo.blockNumber,
      token_id: utxo.token_id.toString(),
      new_owner: this.nextAddressGen.next(utxo.new_owner).value
    };

    let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash), txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner];
    let txRlpEncoded = ethUtil.sha3(RLP.encode(txDataForRlp)).toString('hex');

    let signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), utxo.new_owner);
    txData.signature = signature;
    let createdTx = await createSignedTransaction(txData);
    let savedTx = await txPool.addTransaction(createdTx);

    return savedTx;
  }
  
  async getNextUtxo() {
    if (!(this.utxos && this.utxos.length)) {
      if (!this.blockCreateInProgress) {
        this.blockCreateInProgress = true;
        this.blockCreatePromise = txPool.createNewBlock()
        await this.blockCreatePromise;
        this.blockCreateInProgress = false;
        this.utxos = await getAllUtxos();
      }
    }
    if (!(this.utxos && this.utxos.length)) {
      return null;
    }
    let utxo = this.utxos.shift();
    utxo.new_owner = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase();
  
    if (!accounts.some(addr => addr == utxo.new_owner)) {
      return this.getNextUtxo();
    }
    
    return utxo;
  }
  
}


function* getNextAddress(addresses) {
  let currentAddress = 0;
  let addressToExclude;

  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0;
    }
    if (addressToExclude && addresses[currentAddress] == addressToExclude) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0;
        if (addresses[currentAddress] == addressToExclude) {
          currentAddress++;
        }
      }
    }
    addressToExclude = yield addresses[currentAddress];
  }
}


const testTransactionsCreator = new TestTransactionsCreator;

if (config.isDevelopment) {
  testTransactionsCreator.init();
}

export default testTransactionsCreator;