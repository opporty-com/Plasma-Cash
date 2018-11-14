'use strict'

const RLP = require('rlp')
const ethUtil = require('ethereumjs-util')

const transactionFields = [
  {name: 'prevHash'},
  {name: 'prevBlock', int: true, default: 0},
  {name: 'tokenId', isDecimal: true},
  {name: 'newOwner'},
  {name: 'type'},
  {name: 'signature'},
]

/** Class representing a blockchain plasma transaction. */
class PlasmaTransaction {
  constructor(data) {
    data = data || {}

    initFields(this, transactionFields, data)
  }

  getRlp(excludeSignature) {
    let fieldName = excludeSignature ? '_rlpNoSignature' : '_rlp'
    if (this[fieldName]) {
      return this[fieldName]
    }
    let dataToEncode = [
      this.prevHash instanceof Buffer ?
        this.prevHash :
        ethUtil.addHexPrefix(this.prevHash),
      this.prevBlock,
      ethUtil.toBuffer(this.tokenId),
      this.newOwner,
      this.type,
    ]
    if (!(excludeSignature)) {
      dataToEncode.push(this.signature)
    }

    this[fieldName] = RLP.encode(dataToEncode)
    return this[fieldName]
  }

  getHash(excludeSignature) {
    let fieldName = excludeSignature ? '_hashNoSignature' : '_hash'
    if (this[fieldName]) {
      return this[fieldName]
    }
    this[fieldName] = ethUtil.sha3(this.getRlp(excludeSignature))
    return this[fieldName]
  }

  getRaw() {
    return transactionFields.map((field) => this[field.name])
  }

  getAddressFromSignature(hex) {
    if (this._address) {
      return hex &&
      this._address instanceof Buffer ?
        ethUtil.bufferToHex(this._address) :
        this._address
    }
    let txRlpHashed = ethUtil.hashPersonalMessage(this.getHash(true))
    if (this.signature) {
      let {v, r, s} = ethUtil.fromRpcSig(ethUtil.addHexPrefix(this.signature))
      let publicAddress = ethUtil.ecrecover(txRlpHashed, v, r, s)
      let address = ethUtil.pubToAddress(publicAddress)
      this._address = address
      if (hex) {
        address = ethUtil.bufferToHex(address)
      }
      return address
    }
    return null
  }

  getJson() {
    let data = {}
    data.prevHash = ethUtil.addHexPrefix(this.prevHash.toString('hex'))
    data.prevBlock = ethUtil.bufferToInt(this.prevBlock)
    data.tokenId = this.tokenId.toString()
    data.type = this.type.toString()
    data.newOwner = ethUtil.addHexPrefix(this.newOwner.toString('hex'))
    data.signature = ethUtil.addHexPrefix(this.signature.toString('hex'))

    return data
  }
}

function initFields(self, fields, data) {
  if (data instanceof Buffer) {
    let decodedData = RLP.decode(data)
    fields.forEach((field, i) => {
      if (field.int) {
        if (decodedData[i].length) {
          self[field.name] = decodedData[i].readUIntBE()
        } else {
          self[field.name] = 0
        }
      } else {
        self[field.name] = decodedData[i]
      }
    })
  } else if (Array.isArray(data) && data.length) {
    fields.forEach((field, i) => {
      self[field.name] = data[i]
    })
  } else if (data && typeof data === 'object') {
    fields.forEach((field) => {
      let value = data[field.name]
      if (value) {
        if (field.int && typeof(value)!=='number') {
          if (value instanceof Buffer) {
            value = value.readUIntBE()
          } else {
            value = parseInt(value)
          }
        } else if (!(value instanceof Buffer) &&
        typeof field.int === 'undefined' ) {
          value = ethUtil.toBuffer(field.isDecimal ?
            ethUtil.stripHexPrefix(value) :
            value)
        }
      } else {
        value = field.default
      }
      self[field.name] = value
    })
  }
}


module.exports = PlasmaTransaction
