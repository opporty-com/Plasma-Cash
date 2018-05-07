'use strict';

import RLP from 'rlp';

const ethUtil = require('ethereumjs-util');
const BN = ethUtil.BN;

const inputFields = [
  { name: 'blockNumber' },
  { name: 'txNumber' },
  { name: 'outputNumber' }
];

function initFields(self, fields, data) {
  if (data instanceof Buffer) {
    let decodedData = RLP.decode(data);
    fields.forEach((field, i) => {
      self[field.name] = decodedData[i];
    });
  } else if (data && typeof data === 'object') {
    fields.forEach(field => {
      let value;
      if (data && data[field.name]) {
        value = field.type == 'bn' ? new BN(data[field.name]) : data[field.name];
      } else {
        value = field.default;
      }
      self[field.name] = value;
    });
  }
}

class TransactionInput {
  constructor (data = {}) {
    initFields(this, inputFields, data);
  }

  getRlp() {
    if (this._rlp) {
      return this._rlp;
    }
    let data = initFields.map(field => this[field.name]);
    this._rlp = RLP.encode(data);
    return this._rlp;
  }
}

module.exports = { TransactionInput, inputFields };
