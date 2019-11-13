'use strict'

import db from '../../lib/db';


async function exists(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return (await db.hexists('txpool', hashStr)) !== 0
}

async function size() {
  return await db.hlen('txpool')
}

async function remove(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await db.hdelMany('txpool', hashStr)
}

async function clear() {
  return await db.del('txpool')
}

async function addTransaction(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  await db.hsetAsync('txpool', hashStr, buffer.toString('hex'));
  return hash;
}

async function getTransactions(limit) {
  const tx = await db.hvalsasync("txpool", limit);
  if (tx.length === 0) {
    return []
  }

  return tx.map(t => Buffer.from(t, 'hex'));
}


export {
  exists,
  size,
  remove,
  clear,
  addTransaction,
  getTransactions,
}
