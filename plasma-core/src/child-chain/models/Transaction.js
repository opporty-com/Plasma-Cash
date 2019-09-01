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
import BaseModel from "./Base";

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
    name: 'prevBlock',
    int: true,
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => v.length === 0 ? -1 : ethUtil.bufferToInt(v),
  },
  {
    name: 'tokenId',
    require: true,
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
    name: 'type',
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => v.toString()
  },
  {
    name: 'data',
    isRPL: true,
    encode: v => ethUtil.toBuffer(v || ''),
    decode: v => v.toString()
  },
  {
    name: 'signature', require: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },

  {
    name: 'blockNumber', int: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.bufferToInt(v)
  },
  {
    name: 'hash',
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
];


/** Class representing a blockchain plasma transaction. */
class TransactionModel extends BaseModel {
  // prevHash = null;
  // prevBlock = null;
  // tokenId = null;
  // newOwner = null;
  // type = null;
  // data = null;
  // signature = null;
  // blockNumber = null;

  constructor(data) {
    super(data, fields);
  }

  async isValid() {
    return true;
    if (!isValidFields(this, fields))
      return false;

    const type = this.get('type');
    if (type === TYPES.PAY
      || type === TYPES.VOTE
      || type === TYPES.CANDIDATE
    ) {
      const token = await TokenModel.get(this.get('tokenId'));
      if (!token && this.get('prevBlock') === -1)
        return true;
      if (!token) return false;

      return token.get('owner') === this.getSigner();
    }

    return false;
  }


  async execute() {
    const isValid = await this.isValid();
    if (!isValid) return false;
    const type = this.get('type');

    if (type === TYPES.PAY) {
      await this.saveToken({
        owner: this.get('newOwner'),
        tokenId: this.get('tokenId'),
        amount: 1,
        block: this.get('blockNumber')
      });

      await this.removeFromPool();
      return true;
    }

    if (this.type === TYPES.VOTE) {
      await validators.addStake({
        voter: this.getSigner(),
        candidate: this.get('newOwner'),
        value: 1,
      });

      await this.saveToken({
        owner: this.get('newOwner'),
        tokenId: this.get('tokenId'),
        amount: 1,
        block: this.get('blockNumber')
      });

      await this.removeFromPool();
      return true;
    }

    if (this.type === TYPES.UN_VOTE) {
      await validators.toLowerStake({
        voter: this.getSigner(),
        candidate: this.get('newOwner'),
        value: 1,
      });

      await this.saveToken({
        owner: this.get('newOwner'),
        tokenId: this.get('tokenId'),
        amount: 1,
        block: this.get('blockNumber')
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
      amount: oldToken ? oldToken.get('amount') : amount,
      block
    });
    await token.save();
    await this.save();
    if (oldToken)
      await TransactionDb.removeFromAddress(oldToken.get('owner'), this.getHash());
    await TransactionDb.addToAddress(owner, this.getHash());
    await TransactionDb.addToToken(tokenId, this.getHash());
    return this;
  }

  async save() {
    await TransactionDb.add(this.getHash(), this.getRlp());
  }

  getBuffer(excludeSignature = false, excludeHash = false) {
    let dataToEncode = [
      this.prevHash,
      this.prevBlock,
      this.tokenId,
      this.newOwner,
      this.type,
      this.data
    ];

    if (!excludeSignature) {
      dataToEncode.push(this.signature);
      if (!excludeHash) {
        dataToEncode.push(this.blockNumber);
        dataToEncode.push(this.getHash());
      }
    }
    return dataToEncode
  }

  getRlp(excludeSignature = false, excludeHash = false) {
    let fieldName = `_rlp${excludeSignature && "NoSignature"}${(excludeSignature && excludeHash) && "NoHash"}`;
    if (this[fieldName]) {
      return this[fieldName]
    }
    const dataToEncode = this.getBuffer(excludeSignature, excludeHash);
    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }

  getHash(excludeSignature = false) {
    let fieldName = excludeSignature ? '_hashNoSignature' : 'hash';
    if (this[fieldName] && this[fieldName].length) {
      return this[fieldName]
    }
    this[fieldName] = ethUtil.sha3(this.getRlp(excludeSignature, true));
    return this[fieldName]
  }

  getSigner() {
    const hash = this.getHash(true);
    return getAddressFromSign(hash, this.signature);
  }

  getRaw() {
    return fields.map((field) => this[field.name])
  }


  async removeFromPool() {
    return await TxMemPoolDb.remove(this.getHash());
  }

  async pushToPool() {
    return await TxMemPoolDb.addTransaction(this.getHash(), this.getRlp())
  }

  static async getPoolSize() {
    return await TxMemPoolDb.size();
  }

  static async getPool(json, limit) {
    const data = await TxMemPoolDb.getTransactions();
    if (data.length === 0) {
      return []
    }
    let transactions = data;
    if (limit)
      transactions = data.slice(0, limit);
    if (json) {
      return transactions.map(el => new TransactionModel(el).getJson())
    }
    return transactions.map(el => new TransactionModel(el))
  }

  static async getPoolByHashes(hashes) {
    const data = await TxMemPoolDb.getTransactionsByHashes(hashes);
    return data.map(tx => tx ? new TransactionModel(tx) : new TransactionModel())
  }


  static async get(hash) {
    const tx = await TransactionDb.get(hash);
    if (!tx)
      return null;
    return new TransactionModel(tx);
  }

  static async getByHashes(hashes) {
    const txs = await TransactionDb.getByHashes(hashes);
    if (!txs || !txs.length)
      return [];

    return txs.map(tx => new TransactionModel(tx));
  }

  static async getByToken(tokenId, hashOnly = false) {
    const transactions = await TransactionDb.getByToken(tokenId);
    if (!transactions) return [];
    if (hashOnly) return transactions;
    return Promise.all(transactions.map(hash => TransactionModel.get(hash)));
  }

  static async getLastByToken(tokenId, hashOnly = false) {
    const hash = await TransactionDb.getLastByToken(tokenId);
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
