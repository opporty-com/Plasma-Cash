/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import Boom from "@hapi/boom";
import plasma from "../lib/plasma-client";

async function send(request, h) {
  const transaction = request.payload;

  let result
  try {
    result = await plasma({action: "sendTransaction", payload: transaction});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}


async function getPool(request, h) {
  let result
  try {
    result = await plasma({action: "getPool", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function get(request, h) {
  const {hash} = request.params;

  let result
  try {
    result = await plasma({action: "getTransactionsByHash", payload: hash});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

export {
  send,
  getPool,
  get
}
