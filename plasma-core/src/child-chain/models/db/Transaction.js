/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import redis from '../../lib/redis';


async function add(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await redis.hset('transactions', hashStr, buffer.toString('hex'));
}

async function addToToken(token, hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  await redis.hset(`transactions:token:last`, token, hashStr);
  return await redis.sadd(`transactions:token:${token}`, hashStr);
}

async function getLastByToken(token) {
  return await redis.hget("transactions:token:last", token);
}

async function addToAddress(address, hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await redis.sadd(`transactions:address:${address}`.toLowerCase(), hashStr);
}


async function get(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const data = await redis.hget("transactions", hashStr);
  if (!data) return null;
  return Buffer.from(data, 'hex');
}


async function getByToken(token) {
  return await redis.smembers(`transactions:token:${token}`);
}

async function getByAddress(address) {
  return await redis.smembers(`transactions:address:${address}`.toLowerCase());
}

async function count() {
  return await redis.hlen(`transactions`);
}

export {
  add,
  addToToken,
  addToAddress,
  get,
  getByToken,
  getByAddress,
  getLastByToken,
  count
}
