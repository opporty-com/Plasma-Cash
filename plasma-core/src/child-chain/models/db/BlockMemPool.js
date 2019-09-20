'use strict'

import redis from '../../lib/redis';

async function exists(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return (await redis.hexists('blockpool', hashStr)) !== 0
}

async function remove(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await redis.hdel('blockpool', hashStr)
}

async function clear() {
  return await redis.del('blockpool')
}

async function add(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const isExist = await exists(hashStr);
  if (isExist)
    await remove(hashStr);
  await redis.hset('blockpool', hashStr, buffer.toString('hex'));
  return hash;
}

async function get(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const data = await redis.hget("blockpool", hashStr);
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
