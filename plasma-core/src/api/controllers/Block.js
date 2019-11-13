/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import Boom from '@hapi/boom'
import {promise as plasma} from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';
import * as Block from "../helpers/Block";

async function get(request, h) {
  const {number} = request.params;

  let result;
  try {
    let block = await plasma({action: "getBlock", payload: {number}});
    result = Block.getJson(block)
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function last(request, h) {
  let result;
  try {
    let block = await plasma({action: "getLastBlock", payload: {}});
    result = Block.getJson(block)
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function proof(request, h) {
  const {tokenId, blockNumber} = request.query;

  let result;
  try {
    let data = await plasma({action: "getProof", payload: {tokenId, blockNumber}});
    result = {hash: ethUtil.addHexPrefix(data.hash.toString('hex'))};
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function checkProof(request, h) {
  const {hash, blockNumber, proof} = request.query;

  let result;
  let payload = {
    hash: Buffer.from(ethUtil.stripHexPrefix(hash), 'hex'),
    blockNumber,
    proof: Buffer.from(ethUtil.stripHexPrefix(proof), 'hex')
  };
  payload.lengthProof = payload.proof.length;
  try {
    result = await plasma({
      action: "checkProof",
      payload
    });
    result.result = Boolean(parseInt(result.result.toString()));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}


export {get, last, proof, checkProof}
