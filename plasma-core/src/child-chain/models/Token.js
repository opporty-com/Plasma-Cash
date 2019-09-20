/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import * as ethUtil from 'ethereumjs-util';
import BD from 'binary-data';
import * as TokenDb from './db/Token';

const Protocol = {
  id: BD.types.string(null),
  owner: BD.types.buffer(20),
  block: BD.types.uint24le,
  amount: BD.types.string(null),
};


function getBuffer(token) {
  if (token._buffer)
    return token._buffer;

  const packet = BD.encode(token, Protocol);
  token._buffer = packet.slice();
  return token._buffer;
}

async function get(id) {
  const buffer = await TokenDb.get(id);
  if (!buffer)
    return null;
  return BD.decode(buffer, Protocol)
}

async function getByOwner(address) {
  const tokens = await TokenDb.getOwner(ethUtil.addHexPrefix(address));
  return Promise.all(tokens.map(token => get(token)));
}

function getJson(token) {
  if (token._json)
    return token._json;
  token._json = {
    id: token.id,
    owner: ethUtil.addHexPrefix(token.owner.toString('hex')),
    block: token.block,
    amount: token.amount

  };
  return token._json;

}

async function save(token) {
  return await TokenDb.add(token.id, getBuffer(token));
}

async function count() {
  return await TokenDb.count();
}

export {
  get,
  getByOwner,
  getJson,
  save,
  count
}
