/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import * as RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import * as BlockDb from './db/Block';

import TransactionModel from './Transaction';

import {initFields, isValidFields, encodeFields} from '../helpers';
import PatriciaMerkle from "../lib/PatriciaMerkle";


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
    decode: v => Array.isArray(v) && v.length && v[0] instanceof TransactionModel ? v : v.map(tx => new TransactionModel(tx))
  },
  {name: 'signature'},
];

class BlockModel {
  constructor(data) {
    this.number = null;
    this.merkleRootHash = null;
    this.transactions = null;
    this.signer = null;
    this.signature = null;
    initFields(this, fields, data || {});

    if (this.merkleRootHash || this.transactions.length === 0)
      return;

    let leaves = this.transactions.map(tx => ({key: tx.tokenId, hash: tx.getHash()}));
    this.txCount = leaves.length;
    this.merkle = new PatriciaMerkle(leaves);
    this.merkle.buildTree();
    this.merkleRootHash = this.merkle.getMerkleRoot();
  }

  static async getLastNumber() {
    return await BlockDb.getLastNumber();
  }

  static async setLastNumber(number) {
    return await BlockDb.settLastNumber(number);
  }

  getMerkleRootHash() {
    return ethUtil.addHexPrefix(this.merkleRootHash.toString('hex'));
  }

  getRlp(excludeSignature) {
    let fieldName = excludeSignature ? '_rlpNoSignature' : '_rlp';
    if (this[fieldName]) {
      return this[fieldName]
    }
    let dataToEncode = encodeFields(this, fields, true);

    let transactions = (this.getTx() || []).map(tx => tx.getBuffer());
    dataToEncode.push(transactions);

    // if (!excludeSignature) {
    //   dataToEncode.push(this.signature)
    // }
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

  async incCommit() {
    return await BlockDb.incCommit(this.merkleRootHash);
  }

  getTx() {
    return this.transactions.map(tx => {
      let t = tx instanceof TransactionModel ? tx : new TransactionModel(tx)
      t.blockNumber = this.number;
      return t;
    })
  }

  async save() {
    await this.add();
    let lastNumber = await BlockModel.getLastNumber();
    if (this.number > lastNumber)
      await BlockModel.setLastNumber(this.number);

    return this;
  }

  async add() {
    await BlockDb.add(this.number.toString(10), this.getRlp());
    return this;
  }

  static async get(number) {
    const block = await BlockDb.get(number);
    if (!block)
      return null;
    return new BlockModel(block);
  }

  getJson() {
    return {
      number: this.number,
      merkleRootHash: this.merkleRootHash,
      transactions: this.getTx().map(tx => tx.getJson()),
      signer: this.signer || null,
      signature: this.signature || null,
    }
  }
}

export default BlockModel
