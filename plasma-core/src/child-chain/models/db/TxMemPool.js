'use strict'

import redis from '../../lib/redis';


async function exists(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return (await redis.hexists('txpool', hashStr)) !== 0
}

async function size() {
  return await redis.hlen('txpool')
}

async function remove(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await redis.hdel('txpool', hashStr)
}

async function clear() {
  return await redis.del('txpool')
}

async function addTransaction(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  await redis.hsetAsync('txpool', hashStr, buffer.toString('hex'));
  return hash;
}

async function getTransactions(limit) {
  const tx = await redis.hvals("txpool");
  if (tx.length === 0) {
    return []
  }
  let transactions = tx;
  if (limit && limit < tx.length)
    transactions = tx.slice(0, limit);

  return transactions.map(t => Buffer.from(t, 'hex'));
}


export {
  exists,
  size,
  remove,
  clear,
  addTransaction,
  getTransactions,
}
