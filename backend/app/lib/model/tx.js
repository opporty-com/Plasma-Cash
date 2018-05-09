'use strict';

import RLP from 'rlp';
const ethUtil = require('ethereumjs-util');
const BN = ethUtil.BN;

const transactionFields = [
  { name: 'prev_hash' },
  { name: 'prev_block' },
  { name: 'token_id', isDecimal: true},
  { name: 'new_owner' },
  { name: 'signature' }
];

function initFields(self, fields, data) {
  if (data instanceof Buffer) {
    let decodedData = RLP.decode(data);
    fields.forEach((field, i) => {
      self[field.name] = decodedData[i];
    });
  } else if (Array.isArray(data) && data.length) {
    fields.forEach((field, i) => {
      self[field.name] = data[i];
    });
  }  else if (data && typeof data === 'object') {
    fields.forEach(field => {
      let value = data && data[field.name];
      if (value) {
        if (!(value instanceof Buffer)) {
          value = ethUtil.toBuffer(field.isDecimal ? removeHexPrefix(value) : value);
        }
      } else {
        value = field.default;
      }
      self[field.name] = value;
    });
  }
}

function removeHexPrefix(str) {
  return (str.slice(0, 2) === '0x') ? str.slice(2) : str;
}

class PlasmaTransaction {
  constructor (data) {
    data = data || {};

    initFields(this, transactionFields, data);
  }

  getRlp(excludeSignature) {
    let fieldName = excludeSignature ? '_rlpNoSignature' : '_rlp';
    if (this[fieldName]) {
      return this[fieldName];
    }
    let dataToEncode = [
      this.prev_hash instanceof Buffer ? this.prev_hash : ethUtil.addHexPrefix(this.prev_hash),
      this.prev_block,
      ethUtil.toBuffer(this.token_id),
      this.new_owner
    ];
    if (!(excludeSignature)) {
      dataToEncode.push(this.signature);
    }

    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName];
  }

  getHash(excludeSignature) {
    let fieldName = excludeSignature ? '_hashNoSignature' : '_hash';
    if (this[fieldName]) {
      return this[fieldName];
    }

    this[fieldName] = ethUtil.sha3(this.getRlp(excludeSignature));
    return this[fieldName];
  }

  getRaw() {
    return transactionFields.map(field => this[field.name]);
  }

  getAddressFromSignature(hex) {
    if (this._address) {
      return hex && this._address instanceof Buffer ? ethUtil.bufferToHex(this._address) : this._address;
    }

    let txRlpHashed = ethUtil.hashPersonalMessage(this.getHash(true));
    if (this.signature) {
      let { v, r, s } = ethUtil.fromRpcSig(ethUtil.addHexPrefix(this.signature));
      let publicAddress = ethUtil.ecrecover(txRlpHashed, v, r, s);
      let address = ethUtil.pubToAddress(publicAddress);
      this._address = address;
      if (hex) {
        address = ethUtil.bufferToHex(address);
      }
      return address;
    }
    return null;
  }

  validate () {
    let isValid = true;
    if (!this.new_owner || !this.signature || !this.token_id) {
      isValid = false;
    }

    return isValid;
  }

  getMerkleHash() {
    if (!this.signature) {
      this.signature = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    }
    return ethUtil.sha3(Buffer.concat([ this.getHash(true), ethUtil.toBuffer(this.signature) ]));
  }

  getJson() {
    let data = {};
    data.prev_block = ethUtil.bufferToInt(this.prev_block);
    data.token_id = this.token_id.toString();
    data.new_owner = ethUtil.addHexPrefix(this.new_owner.toString('hex'));
    data.signature = ethUtil.addHexPrefix(this.signature.toString('hex'));

    return data;
  }
}

module.exports = { PlasmaTransaction };
