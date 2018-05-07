'use strict';

import RLP from 'rlp';

const ethUtil = require('ethereumjs-util');

const BN = ethUtil.BN;
const blockNumberLength = 4;
const txNumberLength =4;
const txOutputNumberLength= 1;

const transactionFields = [
  { name: 'blockNumber1', default: '' },
  { name: 'txNumber1', default: '' },
  { name: 'outputNumber1', default: '' },
  { name: 'sig1' },

  { name: 'blockNumber2', default: '' },
  { name: 'txNumber2', default: '' },
  { name: 'outputNumber2', default: '' },
  { name: 'sig2', default: '' },

  { name: 'newowner1', default: '0x0000000000000000000000000000000000000000' },
  { name: 'denom1', default: '' },
  { name: 'newowner2', default: '0x0000000000000000000000000000000000000000' },
  { name: 'denom2', default: ''},
  { name: 'fee', default: '' }
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

class PlasmaTransaction {
  constructor (data) {
    data = data || {};

    initFields(this, transactionFields, data);

    this._inputs = [];
    this._outputs = [];
    this._outputsRlp = [];
  }

  getRlp(excludeSignatures) {
    let data = transactionFields.reduce((res, field) => {
      if (!(excludeSignatures && (field.name == 'sig1' || field.name == 'sig2'))) {
        res.push(this[field.name]);
      }
      return res;
    }, []);

    this._rlp = RLP.encode(data);
    return this._rlp;
  }

  getHash(excludeSignatures) {
    this._hash = ethUtil.sha3(this.getRlp(excludeSignatures));
    return this._hash;
  }

  getRaw() {
    return transactionFields.map(field => this[field.name]);
  }

  getTransactionInput(inputNumber) {
    if (this._inputs[inputNumber]) {
      return this._inputs[inputNumber];
    }

    let blockNumber = this[`blockNumber${inputNumber}`];
    let txNumber = this[`txNumber${inputNumber}`];
    let outputNumber = this[`outputNumber${inputNumber}`];
    if ((!blockNumber && blockNumber != 0) || (!txNumber && txNumber != 0) || (!outputNumber && outputNumber != 0)) {
      this._inputs[inputNumber] = null;
    } else {
      this._inputs[inputNumber] = [blockNumber, txNumber, outputNumber];
    }
    return this._inputs[inputNumber];
  }

  getTransactionOutput(outputNumber) {
    if (this._outputs[outputNumber]) {
      return this._outputs[outputNumber];
    }

    let newowner = this[`newowner${outputNumber}`];
    let denom = this[`denom${outputNumber}`];
    if (!newowner || (!denom && denom != 0)) {
      this._outputs[outputNumber] = null;
    } else {
      this._outputs[outputNumber] = [newowner, denom];
    }
    return this._outputs[outputNumber];
  }

  getTransactionOutputRlp(outputNumber) {
    if (this._outputsRlp[outputNumber]) {
      return this._outputsRlp[outputNumber];
    }

    let output = this.getTransactionOutput(outputNumber);

    if (!output) {
      this._outputsRlp[outputNumber] = null;
    } else {
      this._outputsRlp[outputNumber] = RLP.encode(output);
    }
    return this._outputsRlp[outputNumber];
  }

  getInputKeys() {
    if (this._inputKeys) {
      return this._inputKeys;
    }
    this._inputKeys = [];

    for (let index of [0, 1]) {
      if (this[`blockNumber${index + 1}`]) {
        let key = Buffer.concat([
          ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(this[`blockNumber${index + 1}`])), blockNumberLength),
          ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(this[`txNumber${index + 1}`])), txNumberLength),
          ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(this[`outputNumber${index + 1}`])), txOutputNumberLength)
        ]).toString('hex');
        this._inputKeys.push(key);
      }
    }
    return this._inputKeys;
  }

  getAddressFromSignature(index, hex) {
    let txRlpEncoded = ethUtil.sha3(this.getRlp(true)).toString('hex');
    if (this[`sig${index}`]) {
      let { v, r, s } = ethUtil.fromRpcSig(ethUtil.addHexPrefix(this[`sig${index}`]));
      let publicAddress = ethUtil.ecrecover(Buffer.from(txRlpEncoded, 'hex'), v, r, s);
      let address = ethUtil.pubToAddress(publicAddress);
      if (hex) {
        address = ethUtil.bufferToHex(address);
      }
      return address;
    }
    return null;
  }

  validate () {
    let isValid = true;
    for (let index of [1, 2]) {
      if (this[`blockNumber${index}`] && !this.getAddressFromSignature(index)) {
        isValid = false;
      }
    }

    return isValid;
  }

  getJson() {
    let data = {};
    let inputs = [];
    let outputs = [];
    for (let index of [1, 2]) {
      if (this[`blockNumber${index}`] && this[`sig${index}`]) {
        let intutData = {
          blockNumber: ethUtil.bufferToInt(this[`blockNumber${index}`].toString()),
          txNumber: ethUtil.bufferToInt(this[`txNumber${index}`].toString()),
          outputNumber: ethUtil.bufferToInt(this[`outputNumber${index}`].toString())
        };
        inputs.push(intutData);
      }

      if (this[`newowner${index}`]) {
        let outputData = {
          address: ethUtil.addHexPrefix(this[`newowner${index}`].toString('hex')),
          amount: new BN(this[`denom${index}`]).toString()
        };
        outputs.push(outputData);
      }
    }
    data.inputs = inputs;
    data.outputs = outputs;
    return data;
  }

  sign1(key) {
    var rsv = ethUtil.ecsign(this.getHash(true) , Buffer.from(key) );
    this.sig1 = "0x" + ( Buffer.concat([new Buffer(rsv.r), new Buffer(rsv.s), new Buffer([rsv.v])]).toString('hex')); 
  }

  sign2(key) {
      var rsv = ethUtil.ecsign(ethUtil.toBuffer(this.getHash(false)) , ethUtil.toBuffer(key) );
      this.sig2 = "0x" + ( Buffer.concat([new Buffer(rsv.r), new Buffer(rsv.s), new Buffer([rsv.v])]).toString('hex')); 
  } 

  confirm(root, key) {
    var rsv = ethUtil.ecsign(ethUtil.sha3( Buffer.concat([  this.getHash(true), ethUtil.toBuffer(root)  ])) , Buffer.from(key) );
    return "0x" + ( Buffer.concat([new Buffer(rsv.r), new Buffer(rsv.s), new Buffer([rsv.v])]).toString('hex')); 
  }

  merkleHash() {
    if (!this.sig1) {
        this.sig1 = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    }
    if (!this.sig2) {
        this.sig2 = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    }
    return ethUtil.sha3(Buffer.concat([  this.getHash(true) , ethUtil.toBuffer(this.sig1), ethUtil.toBuffer(this.sig2)  ])); 
  }


}

module.exports = { PlasmaTransaction };
