/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import * as RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import validators from '../lib/validators';
import plasmaContract from "../../root-chain/contracts/plasma";
import BD from 'binary-data';

import * as TxMemPoolDb from './db/TxMemPool';
import * as TransactionDb from './db/Transaction';
import TokenModel from './Token';

import {initFields, isValidFields, encodeFields, getAddressFromSign} from '../helpers';
import BaseModel from "./Base";
import config from "../../config";

export const TYPES = {
  PAY: 1,
  VOTE: 2,
  UN_VOTE: 3,
  CANDIDATE: 4,
  REGISTRATION: 5,
  PRIVATE: 6
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
    encode: v => ethUtil.intToBuffer(v || -1),
    decode: v => !v || v.length === 0 ? -1 : ethUtil.bufferToInt(v),
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
    encode: v => ethUtil.intToBuffer(v || -1),
    decode: v => !v || v.length === 0 ? -1 : ethUtil.bufferToInt(v)
  },
  {
    name: 'hash',
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
  {
    name: 'timestamp', int: true,
    encode: v => ethUtil.intToBuffer(v || -1),
    decode: v => !v || v.length === 0 ? 0 : ethUtil.bufferToInt(v),
  },
];

const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
  hash: BD.types.buffer(32),
};


const TransactionHashProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
};

const TransactionHashSignerProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
};

const protocols = {
  TransactionProtocol,
  TransactionHashProtocol,
  TransactionHashSignerProtocol
};

/** Class representing a blockchain plasma transaction. */
class TransactionModel extends BaseModel {

  constructor(data, protocol) {
    super(data, fields, protocols[protocol] || TransactionProtocol);
    // super(data, fields, TransactionHashProtocol);
  }

  async isValid() {
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


  async saveToken({owner, tokenId, block}) {
    const oldToken = await TokenModel.get(tokenId);
    let token = new TokenModel({
      owner,
      tokenId,
      amount: oldToken ? oldToken.get('amount') : await plasmaContract.getTokenBalance(tokenId),
      block
    });
    await token.save();
    await this.save();
    if (oldToken)
      await TransactionDb.addToAddress(oldToken.get('owner'), this.getHash());
    await TransactionDb.addToAddress(owner, this.getHash());
    await TransactionDb.addToToken(tokenId, this.getHash());
    return this;
  }

  async save() {
    await TransactionDb.add(this.getHash(), this.getRlp());
  }

  // getBuffer(excludeSignature = false, excludeHash = false) {
  //   let dataToEncode = [
  //     this.prevHash,
  //     this.prevBlock,
  //     this.tokenId,
  //     this.newOwner,
  //     this.type,
  //     this.data
  //   ];
  //
  //   if (!excludeSignature) {
  //     dataToEncode.push(this.signature);
  //     if (!excludeHash) {
  //       dataToEncode.push(this.blockNumber);
  //       dataToEncode.push(this.getHash());
  //       dataToEncode.push(this.timestamp);
  //     }
  //   }
  //   return dataToEncode
  // }

  getRlp(excludeSignature = false, excludeHash = false) {
    let fieldName = `_rlp${excludeSignature && "NoSignature"}${(excludeSignature && excludeHash) && "NoHash"}`;
    if (this[fieldName]) {
      return this[fieldName]
    }
    const dataToEncode = this.getBuffer(excludeSignature, excludeHash);
    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }

  getBuffer(excludeSignature = false) {
    let fieldName = excludeSignature ? '_bufferNoSignature' : '_buffer';
    if (this[fieldName] && this[fieldName].length) {
      return this[fieldName]
    }
    const packet = BD.encode(this, excludeSignature ? TransactionHashProtocol : TransactionHashSignerProtocol);
    this[fieldName] = packet.slice();
    return this[fieldName];
  }


  getHash(excludeSignature = false) {
    // return this.newOwner;
    let fieldName = excludeSignature ? '_hashNoSignature' : 'hash';
    if (this[fieldName] && this[fieldName].length) {
      return this[fieldName]
    }

    this[fieldName] = ethUtil.keccak(this.getBuffer(excludeSignature));
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
    return await TxMemPoolDb.addTransaction(this.getHash(), this.getBuffer())
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
      return transactions.map(el => new TransactionModel(el, "TransactionHashProtocol").getJson())
    }
    return transactions.map(el => new TransactionModel(el, "TransactionHashProtocol"))
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

  static async getByAddress(address, hashOnly = false) {
    const transactions = await TransactionDb.getByAddress(address);
    if (!transactions) return [];
    if (hashOnly) return transactions;
    return Promise.all(transactions.map(hash => TransactionModel.get(hash)));
  }

  static async count() {
    return await TransactionDb.count();
  }
}


export default TransactionModel


const ProtocolWithoutSignature = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  dataLength: BD.types.uint24le,
  data: BD.types.buffer(({node}) => node.dataLength),
};
const ProtocolWithoutHash = {
  ...ProtocolWithoutSignature,
  signature: BD.types.buffer(40),
};

const Protocol = {
  ...ProtocolWithoutHash,
  hash: BD.types.buffer(20),
};

function getBuffer(tx) {
  if (tx._buffer)
    return tx._buffer;

  const packet = BD.encode(tx, Protocol);
  tx._buffer = packet.slice();
  return tx._buffer;
}

function getHash(tx) {
  if (tx.hash)
    return tx.hash;

  if (!tx._hashBuffer) {
    const packet = BD.encode(tx, ProtocolWithoutHash);
    tx._hashBuffer = packet.slice();
  }
  tx.hash = ethUtil.keccak(tx._hashBuffer);
  return tx.hash
}


function getSignHash(tx) {
  if (tx._signHash)
    return tx._signHash;
  if (!tx._signBuffer) {
    const packet = BD.encode(tx, ProtocolWithoutSignature);
    tx._signBuffer = packet.slice();
  }
  tx._signHash = ethUtil.keccak(tx._signBuffer);
  return tx._signHash
}

function sign(tx) {

  if (tx.signature)
    return tx;

  const _signHash = getSignHash(tx);

  let msgHash = ethUtil.hashPersonalMessage(_signHash);
  let key = Buffer.from(config.plasmaNodeKey, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  tx.signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s)

  return tx;
}

function getSigner(tx) {
  if (tx._signer)
    return tx._signer;

  const hash = getSignHash(tx);
  try {
    let sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(this.signature));
    let msgHash = ethUtil.hashPersonalMessage(hash);
    let pubKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    tx._signer = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
  } catch (error) {
    throw new Error("Invalid signature")
  }
  return tx._signer;

}


async function validate(tx) {
  if (tx.type === TYPES.PAY
    || tx.type === TYPES.VOTE
    || tx.type === TYPES.CANDIDATE
  ) {
    const token = await TokenModel.get(tx.tokenId);
    if (!token && tx.prevBlock === -1)
      return true;
    if (!token) return false;

    return token.owner === getSigner(tx);
  }

  return false;
}

async function pushToPool(tx) {
  return await TxMemPoolDb.addTransaction(getHash(tx), getBuffer(tx))
};

export {
  sign,
  validate,
  pushToPool
}
