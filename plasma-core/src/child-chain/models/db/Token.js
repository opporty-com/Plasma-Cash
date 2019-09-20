/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import redis from '../../lib/redis';


async function add(tokenId, buffer) {
  return await redis.hset('utxo', tokenId, buffer.toString('hex'));
}

async function addOwner(owner, tokenId) {
  return await redis.sadd(`utxo:owner:${owner}`.toLowerCase(), tokenId);
}

async function removeOwner(owner, tokenId) {
  return await redis.srem(`utxo:owner:${owner}`.toLowerCase(), tokenId);
}

async function getOwner(owner) {
  return await redis.smembers(`utxo:owner:${owner}`.toLowerCase());
}


async function get(tokenId) {
  const data = await redis.hget(`utxo`, tokenId);
  if (!data) return null;

  return Buffer.from(data, 'hex');

}

async function count() {
  return await redis.hlen(`utxo`);
}

export {
  add,
  addOwner,
  removeOwner,
  getOwner,
  get,
  count
}
