'use strict'

import db from '../../lib/db';

async function exists(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return (await db.hexists('blockpool', hashStr)) !== 0
}

async function remove(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await db.hdel('blockpool', hashStr)
}

async function clear() {
  return await db.del('blockpool')
}

async function add(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const isExist = await exists(hashStr);
  if (isExist)
    await remove(hashStr);
  await db.hset('blockpool', hashStr, buffer.toString('hex'));
  return hash;
}

async function get(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const data = await db.hget("blockpool", hashStr);
  if (!data) return null;
  return Buffer.from(data, 'hex');
}

export {
  exists,
  get,
  remove,
  clear,
  add,
}
