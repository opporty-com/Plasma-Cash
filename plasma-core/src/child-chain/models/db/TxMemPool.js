'use strict'

import redis from '../../lib/redis';


async function exists(hash) {

  return (await redis.hexistsAsync('txpool', hash.toString('hex'))) !== 0
}

async function size() {
  return await redis.hlenAsync('txpool')
}

async function remove(hash) {
  const exist = await exists(hash);
  return await redis.hdelAsync('txpool', hash.toString('hex'))
}

async function clear() {
  return await redis.delAsync('txpool')
}

async function addTransaction(hash, txRpl) {
  if (await this.exists(hash)) {
    throw Error('the transaction is already exists');
  }
  await redis.hsetAsync('txpool', hash.toString('hex'), txRpl);
  return hash;
}

async function removeTransactions(hashes) {
  for (let hashes of hash) {
    await redis.hdelAsync('txpool', hash.toString('hex'))
  }
  return hashes;
}

async function getTransactions() {
  return await redis.hvalsAsync(Buffer.from('txpool'));
}

export {
  exists,
  size,
  remove,
  clear,
  addTransaction,
  removeTransactions,
  getTransactions
}
