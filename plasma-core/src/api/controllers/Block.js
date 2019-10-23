/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import Boom from '@hapi/boom'
import { promise as plasma } from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';
import * as Transaction from "../../child-chain/models/Transaction";

async function get(request, h) {
  const {number} = request.params;

  let result;
  try {
    let data = await plasma({action: "getBlock", payload: {number}});
    data.merkleRootHash = ethUtil.addHexPrefix(data.merkleRootHash.toString('hex'));
    data.signature = ethUtil.addHexPrefix(data.signature.toString('hex'));
    data.transactions = data.transactions.map(tx => Transaction.getJson(tx));
    delete data.countTx;
    result = data;
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}


async function last(request, h) {

  let result;
  try {
    let data = await plasma({action: "getLastBlock", payload: {}});
    data.merkleRootHash = ethUtil.addHexPrefix(data.merkleRootHash.toString('hex'));
    data.signature = ethUtil.addHexPrefix(data.signature.toString('hex'));
    data.transactions = data.transactions.map(tx => Transaction.getJson(tx));
    delete data.countTx;
    result = data;
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
    data.hash = ethUtil.addHexPrefix(data.hash.toString('hex'));
    result = data;
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function checkProof(request, h) {
  const {hash, blockNumber, proof} = request.query;

  let result;
  try {
    result = await plasma({action: "checkProof", payload: {hash: Buffer.from(hash, 'hex'), blockNumber, proof}});
    result.result = Boolean(parseInt(result.result.toString()));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}


export {get, last, proof, checkProof}
