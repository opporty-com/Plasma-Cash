'use strict';

import ethUtil from 'ethereumjs-util';
import redis from 'lib/redis';
import PlasmaTransaction from 'lib/model/tx';
import config from 'config';

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

function checkTransaction(tx) {
  if (!tx.new_owner || !tx.signature || !tx.token_id) 
    return false;
  
  return true;
}

async function getUTXO(blockNumber, token_id) {
  let q = 'utxo_'+ blockNumber.toString(16) +'_'+ token_id.toString();

  let data = await redis.getAsync(Buffer.from(q));
  
  if (data) 
      return new PlasmaTransaction(data);
  
  return null;
}

async function getAllUtxos(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', function(err, res) {
      let res3 = res.map(function(el) {
        return Buffer.from(el);
      })
      if (res3.length) {
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
      } else {
        resolve([]);
      }
    });
  })
}

async function getAllUtxosWithKeys(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', function(err, res) {
      let res3 = res.map(function(el) {
        return Buffer.from(el);
      })
      if (res3.length) {
        redis.mget(res3, function(err2, res2) {
          
          let utxos = res2.map(function(el) {
            let t = new PlasmaTransaction(el);
            if (options.json) {
              t = t.getJson();
            }
            return t;
          });

          let result = {};
          for (let i in res3) {
            result[res3[i]] = utxos[i];
          }
          
          resolve(result);
        })
      } else {
        resolve([]);
      }
    });
  })
}

async function checkInputs(transaction) {
  try {
    if (transaction.prev_block == 0) {
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
  } catch (e) {
    return false;
  }
}


export {
  createDepositTransaction,
  createSignedTransaction,
  getUTXO,
  getAllUtxos,
  getAllUtxosWithKeys,
  checkTransaction,
  checkInputs
};
