import {promiseFromEvent} from "../helpers";
import Boom from "@hapi/boom";

/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */


async function getCandidates( request, h ) {
  let result
  try {
    result = await promiseFromEvent({ action: "getCandidates", payload: {} });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getValidators( request, h ) {
  let result
  try {
    result = await promiseFromEvent({ action: "getValidators", payload: {} });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

async function getCurrent( request, h ) {
  let result
  try {
    result = await promiseFromEvent({ action: "getCurrent", payload: {} });
  } catch (e) {
    Boom.badGateway( e )
  }

  return result
}

export {
  getCandidates,
  getValidators,
  getCurrent
}
