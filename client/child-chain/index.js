'use strict';
import web3 from 'lib/web3';
import contractHandler from 'root-chain/contracts/plasma';
import { logger } from 'lib/logger';
import redis from 'lib/storage/redis';
import Block from 'child-chain/block';
import { txMemPool } from 'child-chain/TxMemPool';
import config from 'config';
import ethUtil from 'ethereumjs-util';
import PlasmaTransaction from 'child-chain/transaction';

async function getBlock(blockNumber) {
  try {
    const block = await redis.getAsync(Buffer.from('block' + blockNumber));
    if (!block)
      throw new Error('Block not found');
    return new Block(block);
  }
  catch (error) {
    logger.info("ERROR" + error.toString());
  }
  return null;
}

async function createDeposit({ key, amount }) {

  let address = web3.utils.isAddress(ethUtil.privateToAddress(ethUtil.keccak256(key)))

  contractHandler.contract.methods.deposit().estimateGas({ from: address, value: amount })
    .then(gas => {
      console.log('done deposit to contract!');
      return contractHandler.contract.methods.deposit().send({ from: address, gas, value: amount })
    }).catch(error => {
      console.log('child-chain createDeposit() error', error.toString())
    });
}

async function createNewBlock() {
  // Collect memory pool transactions into the block
  // should be prioritized
  try {
    let lastBlock = await getLastBlockNumberFromDb();
    let newBlockNumber = lastBlock + config.contractblockStep;

    let transactions = await txMemPool.txs();

    const block = new Block({
      blockNumber: newBlockNumber,
      transactions: transactions
    });

    for (let utxo of block.transactions) {
      let utxoNewKey = "utxo_" + block.blockNumber.toString(10) + "_" + utxo.token_id.toString();

      if (utxo.prev_block != 0) {
        let utxoOldKey = "utxo_" + utxo.prev_block.toString(10) + "_" + utxo.token_id.toString();
        await redis.delAsync(utxoOldKey);
      }
      await redis.setAsync(utxoNewKey, utxo.getRlp());

      //del from pool
      await redis.hdel('txpool', utxo.getHash());
    }

    await redis.setAsync('lastBlockNumber', block.blockNumber);
    await redis.setAsync('block' + block.blockNumber.toString(10), block.getRlp());

    logger.info('New block created - transactions: ', block.transactions.length);

    return block;
  } catch (err) {
    logger.error('createNewBlock error ', err);
  }
  //vector<TxPriority> vecPriority;
  //vecPriority.reserve(mempool.mapTx.size());
  //for (map<uint256, CTxMemPoolEntry>::iterator mi = mempool.mapTx.begin();
}

async function getLastBlockNumberFromDb() {
  let lastBlock = await redis.getAsync('lastBlockNumber');

  if (!lastBlock) {
    redis.setAsync('lastBlockNumber', 0);
    lastBlock = 0;
  } else
    lastBlock = parseInt(lastBlock);

  return lastBlock;
}


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

  let q = 'utxo_' + blockNumber.toString(16) + '_' + token_id.toString();
  let data = await redis.getAsync(Buffer.from(q));
  if (data)
    return new PlasmaTransaction(data);
  return null;
}

async function getAllUtxos(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', function (err, res) {
      let res3 = res.map(function (el) {
        return Buffer.from(el);
      })
      if (res3.length) {
        redis.mget(res3, function (err2, res2) {

          let utxos = res2.map(function (el) {
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
    redis.keys('utxo*', function (err, res) {
      let res3 = res.map(function (el) {
        return Buffer.from(el);
      })
      if (res3.length) {
        redis.mget(res3, function (err2, res2) {

          let utxos = res2.map(function (el) {
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
  getBlock,
  createDeposit,
  createNewBlock,
  getLastBlockNumberFromDb,
  createDepositTransaction,
  createSignedTransaction,
  getUTXO,
  getAllUtxos,
  getAllUtxosWithKeys,
  checkTransaction,
  checkInputs
};

