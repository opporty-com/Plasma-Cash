/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import redis from '../../lib/redis';


async function add(tokenId, tokenRlp) {
  return await redis.hsetAsync(`utxo`, tokenId, tokenRlp);
}

async function addOwner(owner, tokenId) {
  return await redis.saddAsync(`utxo:owner:${owner}`.toLowerCase(), tokenId);
}

async function removeOwner(owner, tokenId) {
  return await redis.sremAsync(`utxo:owner:${owner}`.toLowerCase(), tokenId);
}

async function getOwner(owner) {
  return await redis.smembersAsync(`utxo:owner:${owner}`.toLowerCase());
}


async function get(tokenId) {
  return await redis.hgetAsync(`utxo`, Buffer.from(tokenId));
}

async function count() {
  return await redis.hlenAsync(`utxo`);
}

export {
  add,
  addOwner,
  removeOwner,
  getOwner,
  get,
  count
}
