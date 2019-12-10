import {promise as plasma} from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';
import * as Block from "../helpers/Block";

async function get(number) {
  const data = await plasma({action: "getBlock", payload: {number}});
  return Block.getJson(data);
}

async function last() {
  const data = await plasma({action: "getLastBlock", payload: {}});
  return Block.getJson(data);
}

async function proof(tokenId, blockNumber) {
  const data = await plasma({action: "getProof", payload: {tokenId, blockNumber}});
  return {hash: ethUtil.addHexPrefix(data.hash.toString('hex'))};
}

async function checkProof(hash, blockNumber, proof) {
  let result;
  let payload = {
    hash: Buffer.from(ethUtil.stripHexPrefix(hash), 'hex'),
    blockNumber,
    proof: Buffer.from(ethUtil.stripHexPrefix(proof), 'hex')
  };
  payload.lengthProof = payload.proof.length;

  result = await plasma({action: "checkProof", payload});
  return Boolean(parseInt(result.result.toString()));
}

module.exports = {
  get,
  last,
  proof,
  checkProof
};
