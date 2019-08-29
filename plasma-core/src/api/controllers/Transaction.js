/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */



import { promiseFromEvent } from "../helpers"
import Boom from "@hapi/boom";

async function send( request, h ) {
  const transaction = request.payload;

  let result
  try {
    result = await promiseFromEvent({ action: "sendTransaction", payload: transaction });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}


async function getPool(request, h) {
  let result
  try {
    result = await promiseFromEvent({ action: "getPool", payload: {}  });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function get(request, h) {
  const { hash } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getTransactionsByHash", payload: hash  });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

export {
  send,
  getPool,
  get
}
