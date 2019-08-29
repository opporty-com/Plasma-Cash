/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import Boom from '@hapi/boom'
import { promiseFromEvent } from "../helpers"


async function get( request, h ) {
  const { number } = request.params;

  let result
  try {
    result = await promiseFromEvent({ action: "getBlock", payload:  number  });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}



async function last( request, h ) {

  let result
  try {
    result = await promiseFromEvent({ action: "getLastBlock", payload: {}  });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

export { get, last }
