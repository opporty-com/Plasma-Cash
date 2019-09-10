/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import * as RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import BD from 'binary-data';
import BaseModel from './Base';

import * as BlockDb from './db/Block';

import TransactionModel from './Transaction';

import {initFields, isValidFields, encodeFields} from '../helpers';
import PatriciaMerkle from "../lib/PatriciaMerkle";
import logger from "../lib/logger";

const BlockProtocol = {
  number: BD.types.uint24le,
  merkleRootHash: BD.types.buffer(32),
  signer: BD.types.buffer(20),
  length: BD.types.uint24le,
  transactions: BD.types.array(BD.types.buffer(null), ({node}) => node.length),
};
const BlockSignatureProtocol = {
  ...BlockProtocol,
};

const fields = [
  {
    name: 'number', int: true, default: 0, require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.bufferToInt(v),
    validate: v => v > -2
  },
  {
    name: 'merkleRootHash', require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
  {
    name: 'signer',
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
  {
    name: 'transactions',
    decode: (v, parent) => Array.isArray(v) && v.length && v[0] instanceof TransactionModel ? v : v.map(tx => new TransactionModel(tx))
  },
  {
    name: 'signature',
    encode: v => ethUtil.toBuffer(v),
  },
];

class BlockModel extends BaseModel {
  // number = null;
  // merkleRootHash = null;
  // transactions = null;
  // signer = null;
  // signature = null;

  constructor(data) {
    super(data, fields, BlockProtocol);
  }


  getTxBuffer(txHash) {
    let fieldName = `_rlpTx${txHash && "Hash"}`;
    if (this[fieldName]) {
      return this[fieldName]
    }

    this[fieldName] = this.transactions.map(tx => txHash ? tx.getHash() : tx.getBuffer());
    return this[fieldName];
  }

  // getBuffer(excludeSignature, txHash, excludeTx) {
  //   let dataToEncode = [
  //     this.number,
  //     this.merkleRootHash,
  //     this.signer,
  //   ];
  //   const transactions = excludeTx ? [] : this.getTxBuffer(txHash);
  //   dataToEncode.push(transactions);
  //   if (!excludeSignature) {
  //     dataToEncode.push(this.signature);
  //   }
  //   return dataToEncode
  // }

  getBuffer(excludeSignature = false, txHash, excludeTx) {


    let fieldName = `_buffer${excludeSignature && "NoSignature"}${excludeTx && "NoTx"}${!excludeTx && txHash && "TxHash"}`;
    if (this[fieldName] && this[fieldName].length) {
      return this[fieldName]
    }

    let dataToEncode = {
      number: this.number,
      merkleRootHash: this.merkleRootHash,
      signer: this.signer,
      length: this.transactions.length
    };

    dataToEncode.transactions = excludeTx ? [] : this.getTxBuffer(txHash);
    const packet = BD.encode(dataToEncode, excludeSignature ? BlockProtocol : BlockSignatureProtocol);
    this[fieldName] = packet.slice();
    return this[fieldName];
  }


  getRlp(excludeSignature, txHash, excludeTx) {
    let fieldName = `_rlp${excludeSignature && "NoSignature"}${excludeTx && "NoTx"}${!excludeTx && txHash && "TxHash"}`;
    if (this[fieldName]) {
      return this[fieldName]
    }
    const dataToEncode = this.getBuffer(excludeSignature, txHash, excludeTx);
    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }


  async isValid() {
    if (!isValidFields(this, fields))
      return false;

    for (let tx of this.transactions) {
      let txValid = await tx.isValid();
      if (!txValid)
        return false;
    }
    return true;
  }


  async loadTxFromPool() {
    if (this.transactions[0] instanceof TransactionModel)
      return;

    this.transactions = await TransactionModel.getPoolByHashes(this.transactions);
  }

  async buildMerkle() {
    if (this.merkleRootHash.length > 0 || this.transactions.length === 0)
      return;

    let leaves = this.transactions.map(tx => ({key: tx.tokenId, hash: tx.getHash()}));
    this.merkle = new PatriciaMerkle(leaves);
    this.merkle.buildTree();
    this.merkleRootHash = this.merkle.getMerkleRoot();
  }

  async save() {
    await this.add();
    let lastNumber = await BlockModel.getLastNumber();
    if (this.get('number') > lastNumber)
      await BlockModel.setLastNumber(this.get('number'));

    return this;
  }

  async add() {
    for (let tx of this.transactions)
      tx.set('blockNumber', this.get('number'));
    await BlockDb.add(this.get('number'), this.getRlp());
    return this;
  }

  getJson() {
    let o = {};
    fields.filter(field => field.decode).forEach(field => {
      o[field.name] = this.get(field.name)
    });
    o.transactions = this.transactions.map(tx => tx.getJson());
    return o;
  }

  static async getLastNumber() {
    return await BlockDb.getLastNumber();
  }

  static async setLastNumber(number) {
    return await BlockDb.settLastNumber(number);
  }

  static async get(number) {
    const data = await BlockDb.get(number);
    if (!data)
      return null;
    const block = new BlockModel(data);
    block.transactions = block.transactions.map(tx => new TransactionModel(tx));
    return block
  }
}

export default BlockModel
