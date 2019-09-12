const ethUtil = require( "ethereumjs-util" );
//import { encode as rlpEncode } from 'rlp'
const config = require("../config")
const RLP = require('rlp')

const fields = [
  {name: 'prevHash', require: true, encode: v => v instanceof Buffer ? v : ethUtil.addHexPrefix(v)},
  {name: 'prevBlock', int: true, default: 0, require: true, encode: v => v, validate: v => v > -2},
  {name: 'tokenId', isDecimal: true, require: true, encode: v => ethUtil.toBuffer(v)},
  {name: 'from', require: true, encode: v => v},
  {name: 'to', require: true, encode: v => v},
  {name: 'type', require: true, encode: v => v},
  {name: 'data', encode: v => v},
  {name: 'signature', require: true},
];

const initFields = data => {
  const trx = {}

  fields.forEach((field, index) => {
    let value = data[field.name]

    if (value) {
      if ( !(value instanceof Buffer) && typeof field.int === 'undefined' ) {
        value = ethUtil.toBuffer(field.isDecimal ? ethUtil.stripHexPrefix(value) : value)
      }
    } else value = field.default

    trx[field.name] = value
  })

  return trx
}

const encodeFields = (self, fields) => {
  return fields.filter(f => f.encode).map(f => f.encode(self[f.name]));
}

const createSignature = transactionData => {
  const dataToEncode = encodeFields(transactionData, fields),
    _rlpNoSignature = RLP.encode(dataToEncode),
    txHash = ethUtil.sha3( _rlpNoSignature ),
    signature = ethUtil.ecsign(ethUtil.hashPersonalMessage(txHash), Buffer.from(config.privateKey, 'hex')),
    rpcSig = ethUtil.toRpcSig( signature.v, signature.r, signature.s ) ;

  return rpcSig
}


const createSignTransaction = data => {
  const transactionData = initFields( data ),
    signature = createSignature( transactionData)

  return signature
}

module.exports =  { createSignTransaction }
