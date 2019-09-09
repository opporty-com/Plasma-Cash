/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import * as RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import config from "../../config";


function initFields(self, fields, data) {
  if (data instanceof Buffer) {
    let decodedData = RLP.decode(data);
    if (Array.isArray(decodedData))
      fields.forEach((field, i) => {
        if (!decodedData[i]) return
        // if (field.int) {
        //   if (decodedData[i].length) {
        //     self[field.name] = decodedData[i].readUIntBE()
        //   } else {
        //     self[field.name] = ethUtil.toBuffer('')
        //   }
        // } else {
          self[field.name] = decodedData[i]
        // }
      })

  } else if (Array.isArray(data) && data.length) {
    fields.forEach((field, i) => {
      if (!data[i]) return
      self[field.name] = data[i];
    })
  } else if (data && typeof data === 'object') {
    fields.forEach((field) => {
      let value = data[field.name];
      if (!value && field.default) {
        value = field.default
      }
      self[field.name] = field.encode ? field.encode(value) : value;
    })
  }
}

function isValidFields(self, fields) {
  return fields.filter(f => f.require).every(f => f.validate ? f.validate(self[f.name]) : !!self[f.name]);
}

function encodeFields(self, fields, isRPL = false) {
  return fields.filter(f => f.encode && (!isRPL || f.isRPL)).map(f => f.encode(self[f.name]));
}

function sign(hash) {
  let msgHash = ethUtil.hashPersonalMessage(hash);
  let key = Buffer.from(config.plasmaNodeKey, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
}

function getAddressFromSign(hash, signature) {
  let address;
  try {
    let sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(signature));
    let msgHash = ethUtil.hashPersonalMessage(hash);
    let pubKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    address = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
  } catch (error) {
    throw new Error("Invalid signature")
  }
  return address;
}


export {
  initFields,
  isValidFields,
  encodeFields,
  sign,
  getAddressFromSign
}
