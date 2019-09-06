/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import Boom from '@hapi/boom'
import plasma from "../lib/plasma-client";

async function get(request, h) {
  const {number} = request.params;

  let result
  try {
    result = await plasma({action: "getBlock", payload: number});
  } catch (e) {

    return Boom.badGateway(e)
  }

  return result
}


async function last(request, h) {

  let result
  try {
    result = await plasma({action: "getLastBlock", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

export {get, last}
