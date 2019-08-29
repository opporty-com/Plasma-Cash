/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import * as RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import validators from '../lib/validators';

import * as TxMemPoolDb from './db/TxMemPool';
import * as TransactionDb from './db/Transaction';
import TokenModel from './Token';

import {initFields, isValidFields, encodeFields, getAddressFromSign} from '../helpers';

const TYPES = {
  PAY: 'pay',
  VOTE: 'vote',
  UN_VOTE: 'unvote',
  CANDIDATE: 'candidate',
  REGISTRATION: 'resignation',
  PRIVATE: 'private'
};


const fields = [
  {
    name: 'prevHash',
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
  {
    name: 'prevBlock', int: true, default: 0, require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => v.length === 0 ? -1 : ethUtil.bufferToInt(v),
    validate: v => v > -2
  },
  {
    name: 'tokenId', require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(ethUtil.stripHexPrefix(v)),
    decode: v => v.toString()
  },
  {
    name: 'newOwner',
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))

  },
  {
    name: 'type', require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => v.toString()
  },
  {
    name: 'data',
    default: '',
    isRPL: true,
    encode: v => ethUtil.toBuffer(v || ''),
    decode: v => v.toString()
  },
  {
    name: 'blockNumber',
    default: 0,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.bufferToInt(v)
  },
  {
    name: 'signature', require: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
];


/** Class representing a blockchain plasma transaction. */
class TransactionModel {
  constructor(data) {
    this.prevHash = null;
    this.prevBlock = null;
    this.tokenId = null;
    this.newOwner = null;
    this.type = null;
    this.data = null;
    this.signature = null;
    this.blockNumber = null;
    initFields(this, fields, data || {})
  }

  async isValid() {
    if (!isValidFields(this, fields))
      return false;

    if (this.type === TYPES.PAY
      || this.type === TYPES.VOTE
      || this.type === TYPES.CANDIDATE
    ) {
      const token = await TokenModel.get(this.tokenId);
      if (!token && this.prevBlock === -1)
        return true;

      if (!token) return false;

      return token.owner === this.getSigner();
    }

    return false;
  }

  async execute() {
    const isValid = await this.isValid();
    if (!isValid) return false;

    if (this.type === TYPES.PAY) {

      await this.saveToken({
        owner: ethUtil.addHexPrefix(this.newOwner.toString('hex')),
        tokenId: this.tokenId,
        amount: 1,
        block: this.blockNumber
      });

      await this.removeFromPool();
      return true;
    }

    if (this.type === TYPES.VOTE) {
      await validators.addStake({
        voter: this.getSigner(),
        candidate: ethUtil.addHexPrefix(this.newOwner.toString('hex')),
        value: 1,
      });

      await this.saveToken({
        owner: ethUtil.addHexPrefix(this.newOwner.toString('hex')),
        tokenId: this.tokenId,
        amount: 1,
        block: this.blockNumber
      });

      await this.removeFromPool();
      return true;
    }

    if (this.type === TYPES.UN_VOTE) {
      await validators.toLowerStake({
        voter: this.getSigner(),
        candidate: ethUtil.addHexPrefix(this.newOwner.toString('hex')),
        value: 1,
      });

      await this.saveToken({
        owner: ethUtil.addHexPrefix(this.newOwner.toString('hex')),
        tokenId: this.tokenId,
        amount: 1,
        block: this.blockNumber
      });

      await this.removeFromPool();
      return true;
    }

  }

  async saveToken({owner, tokenId, amount, block}) {
    const oldToken = await TokenModel.get(tokenId);
    let token = new TokenModel({
      owner,
      tokenId,
      amount: oldToken ? oldToken.amount : amount,
      block
    });
    await token.save();
    await this.save();
    if (oldToken)
      await TransactionDb.removeFromAddress(oldToken.owner, this.getHash());
    await TransactionDb.addToAddress(owner, this.getHash());
    await TransactionDb.addToToken(tokenId, this.getHash());
    return this;
  }

  async save() {
    await TransactionDb.add(this.getHash(), this.getRlp());
  }

  getBuffer(excludeSignature, isRPL = false,) {
    let dataToEncode = encodeFields(this, fields, isRPL);

    if (!excludeSignature) {
      dataToEncode.push(ethUtil.toBuffer(this.blockNumber));
      dataToEncode.push(ethUtil.toBuffer(this.signature));
    }
    return dataToEncode
  }

  getRlp(excludeSignature) {
    let fieldName = excludeSignature ? '_rlpNoSignature' : '_rlp';
    if (this[fieldName]) {
      return this[fieldName]
    }
    const dataToEncode = this.getBuffer(excludeSignature, true);

    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }

  getHash(excludeSignature = false) {
    let fieldName = excludeSignature ? '_hashNoSignature' : '_hash';
    if (this[fieldName]) {
      return this[fieldName]
    }
    this[fieldName] = ethUtil.sha3(this.getRlp(excludeSignature));
    return this[fieldName]
  }

  getSigner() {
    const hash = this.getHash(true);
    return getAddressFromSign(hash, this.signature);
  }

  getRaw() {
    return fields.map((field) => this[field.name])
  }

  getJson() {
    return {
      prevHash: this.prevHash,
      prevBlock: this.prevBlock,
      tokenId: this.tokenId,
      data: this.data,
      type: this.type,
      newOwner: this.newOwner,
      signature: this.signature ? this.signature : null,
      blockNumber: this.blockNumber,
      hash: ethUtil.addHexPrefix(this.getHash().toString('hex'))
    }
  }

  async removeFromPool() {
    return await TxMemPoolDb.remove(this.getHash());
  }

  async pushToPool() {
    return await TxMemPoolDb.addTransaction(this.getHash(), this.getRlp(false))
  }

  static async getPoolSize() {
    return await TxMemPoolDb.size();
  }

  static async getPool(json = false) {
    const transactions = await TxMemPoolDb.getTransactions();

    if (transactions.length === 0) {
      return []
    }
    if (json) {
      return transactions.map(el => new TransactionModel(el).getJson())
    }

    return transactions.map(el => new TransactionModel(el))

  }

  static async get(hash) {
    const tx = await TransactionDb.get(hash);
    if (!tx)
      return null;
    return new TransactionModel(tx);
  }

  static async getByToken(token, hashOnly = false) {
    const transactions = await TransactionDb.getByToken(token);
    if (!transactions) return [];
    if (hashOnly) return transactions;
    return Promise.all(transactions.map(hash => TransactionModel.get(hash)));
  }

  static async getLastByToken(token, hashOnly = false) {
    const hash = await TransactionDb.getLastByToken(token);
    if (!hash) return null;

    if (hashOnly)
      return hash;

    return await TransactionModel.get(hash)


  }

  static async count() {
    return await TransactionDb.count();
  }
}


export default TransactionModel
