'use strict';

import ethUtil from 'ethereumjs-util';
import levelDB from 'lib/db';
const BN = ethUtil.BN;
import config from "../config";
const { prefixes: { utxoPrefix }, plasmaOperatorAddress } = config;

import { blockNumberLength, tokenIdLength } from 'lib/dataStructureLengths';
import { PlasmaTransaction } from 'lib/model/tx';

async function getUTXO(blockNumber, token_id) {
  let blockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(blockNumber)), blockNumberLength)
  let tokenIdBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(token_id), tokenIdLength)
  let query = Buffer.concat([utxoPrefix, blockNumberBuffer, tokenIdBuffer]);  

  try {
    let data = await levelDB.get(query);
    return new PlasmaTransaction(data);
  }
  catch(err) {
    return null;
  }
}

function createDepositTransaction(addressTo, amountBN, token_id) {
  let txData = {
    prev_hash: '',
    prev_block: new BN(0),
    token_id,
    new_owner: ethUtil.addHexPrefix(addressTo)
  };
  
  const tx = new PlasmaTransaction(txData);
  return tx;
}

async function createSignedTransaction(data) {
  let txData = {};
  txData.prev_hash = data.prev_hash;
  txData.prev_block = data.prev_block;
  txData.token_id = data.token_id;
  txData.new_owner = data.new_owner;
  txData.signature = data.signature;
    
  let tx = new PlasmaTransaction(txData);
  return tx;
}

async function getAllUtxos(address, options = {}) {
  return await new Promise((resolve, reject) => {
    try { 
      const uxtos = [];    
      const start = Buffer.concat([utxoPrefix, Buffer.alloc(blockNumberLength), Buffer.alloc(tokenIdLength)]);
      const end = Buffer.concat([utxoPrefix, Buffer.from("ff".repeat(blockNumberLength), 'hex'), Buffer.from("9".repeat(tokenIdLength))]);
      
      let blockStart = utxoPrefix.length;
      let tokenIdStart = blockStart + blockNumberLength;
      
      levelDB.createReadStream({gte: start, lte: end})
        .on('data', function (data) {
          let utxo = new PlasmaTransaction(data.value);

          if (!options.json) {
            utxo.blockNumber = ethUtil.bufferToInt(data.key.slice(blockStart, tokenIdStart));
            uxtos.push(utxo);
            return;
          }
          let uxtosJson = utxo.getJson();
          if (utxo && utxo.new_owner && address && utxo.new_owner.toLowerCase() != address.toLowerCase()) {
            return;
          }
          
          uxtosJson.blockNumber = ethUtil.bufferToInt(data.key.slice(blockStart, tokenIdStart));
          if (options.includeKeys) {
            uxtosJson.key = data.key;
          }

          uxtos.push(uxtosJson);
        })
        .on('error', function (error) {
            console.log('error', error);
        })
        .on('end', function () {
          resolve(uxtos)
        })
    }
    catch(error){
      console.log('error', error);
    }
  })
}

module.exports = {
  createDepositTransaction,
  createSignedTransaction,
  getUTXO,
  getAllUtxos
};
