/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import db from '../../lib/db';


async function add(hash, buffer) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await db.hsetAsync('transactions', hashStr, buffer.toString('hex'));
}

async function addToToken(token, hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  await db.hset(`transactions:token:last`, token, hashStr);
  return await db.sadd(`transactions:token:${token}`, hashStr);
}

async function getLastByToken(token) {
  return await db.hget("transactions:token:last", token);
}

async function addToAddress(address, hash) {
  const addressStr = address instanceof Buffer ? address.toString('hex') : address;
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  return await db.sadd(`transactions:address:${addressStr}`.toLowerCase(), hashStr);
}


async function get(hash) {
  const hashStr = hash instanceof Buffer ? hash.toString('hex') : hash;
  const data = await db.hget("transactions", hashStr);
  if (!data) return null;
  return Buffer.from(data, 'hex');
}


async function getByToken(token) {
  return await db.smembers(`transactions:token:${token}`);
}

async function getByAddress(address) {
  const addressStr = address instanceof Buffer ? address.toString('hex') : address;
  return await db.smembers(`transactions:address:${addressStr}`.toLowerCase());
}

async function count() {
  return await db.hlen(`transactions`);
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
