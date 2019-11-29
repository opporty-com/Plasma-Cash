/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import Boom from "@hapi/boom";
import { promise as plasma } from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';


async function getCandidates(request, h) {
  let result;
  try {
    result = await plasma({action: "getCandidates", payload: {}});
  } catch (e) {
    return Boom.badGateway(e)
  }
  return result;
}

async function getValidators(request, h) {
  let result;
  try {
    let data = await plasma({action: "getValidators", payload: {}});
    result = data.validators.map(vd => ethUtil.addHexPrefix(vd.toString('hex')));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

async function getCurrent(request, h) {
  let result;
  try {
    let data = await plasma({action: "getCurrent", payload: {}});
    result = ethUtil.addHexPrefix(data.address.toString('hex'));
  } catch (e) {
    return Boom.badGateway(e)
  }

  return result;
}

export {
  getCandidates,
  getValidators,
  getCurrent
}
