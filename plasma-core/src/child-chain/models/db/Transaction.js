/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import redis from '../../lib/redis';


async function add(hash, transactionRlp) {
  return await redis.hsetAsync(`transactions`, hash.toString('hex'), transactionRlp);
}

async function addToToken(token, hash) {
  await redis.hsetAsync(`transactions:token:last`, token.toLowerCase(), hash.toString('hex'));
  return await redis.saddAsync(`transactions:token:${token}`.toLowerCase(), hash.toString('hex'));
}

async function getLastByToken(token) {
  return await redis.hgetAsync("transactions:token:last", token.toLowerCase());
}

async function addToAddress(address, hash) {
  return await redis.saddAsync(`transactions:address:${address}`.toLowerCase(), hash.toString('hex'));
}

async function removeFromAddress(address, hash) {
  return await redis.sremAsync(`transactions:address:${address}`.toLowerCase(), hash.toString('hex'));
}

async function get(hash) {
  return await redis.hgetAsync(Buffer.from("transactions"), hash.toString('hex'));
}

async function getByHashes(hashes) {
  return await redis.hmgetAsync(Buffer.from("transactions"), hashes.map(hash => hash.toString('hex')));
}

async function getByToken(token) {
  return await redis.smembersAsync(`transactions:token:${token}`.toLowerCase());
}

async function getByAddress(address) {
  return await redis.smembersAsync(`transactions:address:${address}`.toLowerCase());
}

async function count() {
  return await redis.hlenAsync(`transactions`);
}

export {
  add,
  addToToken,
  addToAddress,
  removeFromAddress,
  get,
  getByHashes,
  getByToken,
  getByAddress,
  getLastByToken,
  count
}
