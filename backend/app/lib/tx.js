'use strict';

import ethUtil from 'ethereumjs-util';

import redis from 'lib/redis';
const BN = ethUtil.BN;
import config from "../../config";
const { prefixes: { utxoPrefix } } = config;

import { PlasmaTransaction } from 'lib/model/tx';

function createDepositTransaction(addressTo, amountBN, token_id) {
  let txData = {
    prev_hash: '',
    prev_block: 0,
    token_id,
    new_owner: ethUtil.addHexPrefix(addressTo)
  };
  
  return new PlasmaTransaction(txData);
}

function createSignedTransaction(data) {
  let txData = {
    prev_hash: ethUtil.toBuffer(ethUtil.addHexPrefix(data.prev_hash)),
    prev_block: data.prev_block,
    token_id: data.token_id,
    new_owner: data.new_owner,
    signature: data.signature
  };

  return new PlasmaTransaction(txData);
}

async function getUTXO(blockNumber, token_id) {
  console.log('getUTXO', blockNumber, token_id)
  let q = utxoPrefix + blockNumber.toString(16) + token_id.toString();
  let data = await redis.getAsync(q);
  
  if (data) 
      return new PlasmaTransaction(data);
  
  return null;
}

async function getAllUtxos(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', function(err, res) {
      let res3 = res.map(function(el) {
        return new Buffer(el);
      })
 
      redis.mget(res3, function(err2, res2) {
        
        let utxos = res2.map(function(el) {
          let t = new PlasmaTransaction(el);
          if (options.json) {
            t = t.getJson();
          }
          return t;
        });
        
        resolve(utxos);
      })
    });
  })
}

module.exports = {
  createDepositTransaction,
  createSignedTransaction,
  getUTXO,
  getAllUtxos
};
