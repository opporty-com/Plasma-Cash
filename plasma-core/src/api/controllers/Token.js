/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import Boom from "@hapi/boom";
import { promise as plasma } from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';
import * as Transaction from "../../child-chain/models/Transaction";

async function get(request, h) {
  const {tokenId} = request.params;

  let result;
  try {
    let data = await plasma({action: "getToken", payload: {tokenId}});
    data.owner = ethUtil.addHexPrefix(data.owner.toString('hex'));
    delete data.status;
    result = data;
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

async function getByAddress(request, h) {
  const {address} = request.params;

  let result;
  try {
    let data = await plasma({action: "getTokenByAddress", payload: {address: Buffer.from(address, 'hex')}});
    result = data.tokens;
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

async function getTransactions(request, h) {
  const {tokenId} = request.params;

  let result;
  try {
    let data = await plasma({action: "getTransactionsByTokenId", payload: {tokenId}});
    result = data.transactions.map(tx => Transaction.getJson(tx));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getLastTransaction(request, h) {
  const {tokenId} = request.params;

  let result;
  try {
    let data = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});
    result = Transaction.getJson(data);
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

export { get, getByAddress, getTransactions, getLastTransaction }
