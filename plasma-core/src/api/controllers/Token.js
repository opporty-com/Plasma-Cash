/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import Boom from "@hapi/boom";
import { promise as plasma } from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';
import * as Transaction from "../helpers/Transaction";
import * as Token from "../helpers/Token";

async function get(request, h) {
  const {tokenId} = request.params;

  let result;
  try {
    let data = await plasma({action: "getToken", payload: {tokenId}});
    result = Token.getJson(data);
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

async function getByAddress(request, h) {
  const {address} = request.params;

  let result;
  try {
    let data = await plasma({action: "getTokenByAddress", payload: {address: Buffer.from(ethUtil.stripHexPrefix(address), 'hex')}});
    result = data.tokens.map(token=>Token.getJson(token));
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
