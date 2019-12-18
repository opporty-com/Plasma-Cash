import { promise as plasma } from "../lib/plasma-client";
import * as ethUtil from 'ethereumjs-util';

async function getCandidates(request, h) {
  return await plasma({action: "getCandidates", payload: {}});
}

async function getValidators(request, h) {
  const data = await plasma({action: "getValidators", payload: {}});
  return data.validators.map(vd => ethUtil.addHexPrefix(vd.toString('hex')));
}

async function getCurrent(request, h) {
  const data = await plasma({action: "getCurrent", payload: {}});
  return ethUtil.addHexPrefix(data.address.toString('hex'));
}

module.exports = {
  getCandidates,
  getValidators,
  getCurrent
};
