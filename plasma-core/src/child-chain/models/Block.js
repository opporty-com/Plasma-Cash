/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import * as RLP from 'rlp'
import * as ethUtil from 'ethereumjs-util';
import BD from 'binary-data';

import PatriciaMerkle from "../lib/PatriciaMerkle";

import config from "../../config";

import * as BlockDb from './db/Block';
import * as BlockPoolDb from './db/BlockMemPool';

import * as Transaction from './Transaction';


const Protocol = {
  number: BD.types.uint24le,
  merkleRootHash: BD.types.buffer(32),
  signature: BD.types.buffer(65),
  countTx: BD.types.uint24le,
  transactions: BD.types.array(Transaction.Protocol, ({current}) => current.countTx),
};


function getBuffer(block, force = false) {
  if (!force && block._buffer)
    return block._buffer;

  const packet = BD.encode(block, Protocol);
  block._buffer = packet.slice();

  return block._buffer;
}

function fromBuffer(buffer) {
  let block = BD.decode(buffer, Protocol);
  block._buffer = buffer;
  return block
}

async function buildMerkle(block, force) {
  if (block.transactions.length === 0)
    return;

  if (!force && block.merkleRootHash)
    return;

  let leaves = block.transactions.map(tx => ({key: tx.tokenId, hash: tx.hash}));
  block._merkle = new PatriciaMerkle(leaves);
  await block._merkle.buildTree();
}

async function getMerkleRootHash(block) {
  if (block.merkleRootHash)
    return block.merkleRootHash;

  if (!block._merkle)
    await buildMerkle(block);

  block.merkleRootHash = block._merkle.getMerkleRoot();
  return block.merkleRootHash

}

async function getProof(block, tokenId) {
  if (!block._merkle)
    await buildMerkle(block, true);

  return block._merkle.getProof(tokenId, true)
}


async function checkProof(block, proof, hash) {
  if (!block._merkle)
    await buildMerkle(block, true);
  return block._merkle.checkProof(proof, hash)
}

async function getSignHash(block) {
  if (block._signHash)
    return block._signHash;
  if (!block._signBuffer) {

    if (!block.merkleRootHash)
      await getMerkleRootHash(block);
    const dataToEncode = [
      block.number,
      block.merkleRootHash,
    ];
    block._signBuffer = RLP.encode(dataToEncode);
  }
  block._signHash = ethUtil.keccak(block._signBuffer);
  return block._signHash
}

async function sign(block) {
  if (block.signature)
    return block;

  const _signHash = await getSignHash(block);

  let msgHash = ethUtil.hashPersonalMessage(_signHash);
  let key = Buffer.from(config.plasmaNodeKey, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  block.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s));

  return block.signature;
}

async function validate(block) {
  for (let tx of block.transactions) {
    let txValid = await Transaction.validate(tx);
    if (!txValid)
      return false;
  }
  return true;
}

async function pushToPool(block) {
  return await BlockPoolDb.add(await getMerkleRootHash(block), getBuffer(block))
}

async function getPool(merkle) {
  const hash = ethUtil.stripHexPrefix(merkle);
  const buffer = await BlockPoolDb.get(hash);
  return fromBuffer(buffer);
}

async function removeFromPool(block) {
  return await BlockPoolDb.remove(await getMerkleRootHash(block));
}


async function getSigner(block) {
  if (block._signer)
    return block._signer;

  const _signHash = await getSignHash(block);
  let msgHash = ethUtil.hashPersonalMessage(_signHash);
  let sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(block.signature));
  let pubKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
  block._signer = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));

  return block._signer;
}


async function save(block) {
  return await BlockDb.add(block.number, getBuffer(block, true))
}

async function get(number) {
  const buffer = await BlockDb.get(number);
  return fromBuffer(buffer);
}

function getJson(block) {
  if (block._json)
    return block._json;

  block._json = {
    number: block.number,
    merkleRootHash: ethUtil.addHexPrefix(block.merkleRootHash.toString('hex')),
    signature: ethUtil.addHexPrefix(block.signature.toString('hex')),
    transactions: block.transactions.map(tx => Transaction.getJson(tx))
  };

  return block._json;
}

export {
  buildMerkle,
  getProof,
  checkProof,
  getMerkleRootHash,
  sign,
  getSigner,
  getBuffer,
  fromBuffer,
  validate,
  pushToPool,
  getPool,
  removeFromPool,
  save,
  get,
  getJson
}
