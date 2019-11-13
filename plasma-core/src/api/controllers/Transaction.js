/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import Boom from "@hapi/boom";
import * as ethUtil from 'ethereumjs-util';
import { promise as plasma } from "../lib/plasma-client";
import * as Transaction from "../helpers/Transaction";

async function send(request, h) {
  const transaction = request.payload;

  let result;
  try {
    const {prevHash, data, newOwner, signature} = transaction;
    transaction.prevHash = Buffer.from(prevHash, 'hex');
    transaction.data = Buffer.from(data, 'hex');
    transaction.newOwner = Buffer.from(newOwner, 'hex');
    transaction.signature = Buffer.from(signature,'hex');
    transaction.dataLength = transaction.dataLength || 0;

    result = await plasma({action: "sendTransaction", payload: transaction});
  } catch (e) {
    console.log(e);
    return Boom.badGateway(e)
  }

  return result;
}


async function getPool(request, h) {
  let result;
  try {
    let data = await plasma({action: "getPool", payload: {}});
    result = data.transactions.map(tx => Transaction.getJson(tx));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

async function get(request, h) {
  const {hash} = request.params;

  let result;
  try {
    let tx = await plasma({action: "getTransactionByHash", payload: {hash: Buffer.from(ethUtil.stripHexPrefix(hash), 'hex')}});
    result = Transaction.getJson(tx);
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getTransactionsByAddress( request, h ) {
  const { address } = request.params;

  let result;
  try {
    let data = await plasma({ action: "getTransactionsByAddress", payload: {address}});
    result = data.transactions.map(tx => Transaction.getJson(tx));
  } catch (e) {
    Boom.badGateway( e )
  }

  return result;
}

export {
  send,
  getPool,
  get,
  getTransactionsByAddress
}
