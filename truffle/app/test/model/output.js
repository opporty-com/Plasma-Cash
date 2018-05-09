'use strict';

import RLP from 'rlp';
const ethUtil = require('ethereumjs-util');
const BN = ethUtil.BN;

const outputFields = [
  { name: 'newowner' },
  { name: 'denom' }
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

class TransactionOutput {
  constructor (data) {
    data = data || {};

    initFields(this, outputFields, data);
  }

  getJson() {
    let data = {};
    data.address = '0x' + ethUtil.stripHexPrefix(this.newowner.toString('hex'));
    data.amount = new BN(this.denom).toString();
    return data;
  }
}

module.exports = { TransactionOutput };
