/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import Boom from "@hapi/boom";
import plasma from "../lib/plasma-client";


async function getCandidates(request, h) {
  let result
  try {
    result = await plasma({action: "getCandidates", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getValidators(request, h) {
  let result
  try {
    result = await plasma({action: "getValidators", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

async function getCurrent(request, h) {
  let result
  try {
    result = await plasma({action: "getCurrent", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result
}

export {
  getCandidates,
  getValidators,
  getCurrent
}
