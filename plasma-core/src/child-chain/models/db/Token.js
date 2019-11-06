/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import db from '../../lib/db';


async function add(tokenId, buffer) {
  return await db.hsetAsync('utxo', tokenId, buffer.toString('hex'));
}

async function addOwner(owner, tokenId) {
  const ownerStr = owner instanceof Buffer ? owner.toString('hex') : owner;
  return await db.sadd(`utxo:owner:${ownerStr}`.toLowerCase(), tokenId);
}

async function removeOwner(owner, tokenId) {
  return await db.srem(`utxo:owner:${owner}`.toLowerCase(), tokenId);
}

async function getOwner(owner) {
  return await db.smembers(`utxo:owner:${owner}`.toLowerCase());
}


async function get(tokenId) {
  const data = await db.hget(`utxo`, tokenId);
  if (!data) return null;

  return Buffer.from(data, 'hex');

}

async function count() {
  return await db.hlen(`utxo`);
}

export {
  add,
  addOwner,
  removeOwner,
  getOwner,
  get,
  count
}
