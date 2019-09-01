/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import Boom from "@hapi/boom";
import plasma from "../lib/plasma-client";

async function get(request, h) {
  const {tokenId} = request.params;

  let result
  try {
    result = await plasma({action: "getToken", payload: tokenId});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getByAddress(request, h) {
  const {address} = request.params;

  let result
  try {
    result = await plasma({action: "getTokenByAddress", payload: address});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getTransactions(request, h) {
  const {tokenId} = request.params;

  let result
  try {
    result = await plasma({action: "getTransactionsByTokenId", payload: tokenId});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getLastTransaction(request, h) {
  const {tokenId} = request.params;

  let result
  try {
    result = await plasma({action: "getLastTransactionByTokenId", payload: tokenId});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

export {get, getByAddress, getTransactions, getLastTransaction}
