/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import { promiseFromEvent } from "../helpers"
import Boom from "@hapi/boom";

async function get( request, h ) {
  const { tokenId } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getToken", payload: tokenId });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getByAddress( request, h ) {
  const { address } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getTokenByAddress", payload: address });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getTransactions( request, h ) {
  const { tokenId } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getTransactionsByTokenId", payload: tokenId });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getTransactionsByAddress( request, h ) {
  const { address } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getTransactionsByAddress", payload: address });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getLastTransaction( request, h ) {
  const { tokenId } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getLastTransactionByTokenId", payload: tokenId });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

export { get, getByAddress, getTransactions, getLastTransaction, getTransactionsByAddress }
