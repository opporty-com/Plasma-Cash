'use strict'

import redis from '../../lib/redis';
import logger from "../../lib/logger";


async function exists(hash) {
  const hashStr = hash.toString('hex');
  return (await redis.hexistsAsync('txpool', hashStr)) !== 0
}

async function size() {
  return await redis.hlenAsync('txpool')
}

async function remove(hash) {
  const hashStr = hash.toString('hex');
  return await redis.hdelAsync('txpool', hashStr)
}

async function clear() {
  return await redis.delAsync('txpool')
}

async function addTransaction(hash, txRpl) {
  // const hashStr = hash.toString('hex');
  // const hashStr = hash;
  // if (await this.exists(hash)) {
  //   throw Error('the transaction is already exists');
  // }
  //
  // console.log(hashStr, txRpl);
  // console.log(hashStr.length, txRpl.length);
  // const rpl = txRpl.toString('hex');
  // await redis.hsetAsync('txpool', hash, txRpl);
  await redis.hsetAsync('txpool', hash, txRpl.toString('hex'));
  return hash;
}

async function removeTransactions(hashes) {
  for (let hash of hashes) {
    await redis.hdelAsync('txpool', hash.toString('hex'))
  }
  return hashes;
}

async function getTransactions(onlyHash) {
  const tx = await redis.hvalsAsync(Buffer.from("txpool"));
  return tx;
}

async function getTransactionsByHashes(hashes) {
  const hashesStr = hashes.map(hash => hash.toString('hex'));
  return await redis.hmgetAsync(Buffer.from("txpool"), hashesStr);
}

export {
  exists,
  size,
  remove,
  clear,
  addTransaction,
  removeTransactions,
  getTransactions,
  getTransactionsByHashes
}
