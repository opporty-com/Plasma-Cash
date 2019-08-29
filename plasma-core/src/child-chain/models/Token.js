/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import * as RLP from 'rlp';
import ethUtil from 'ethereumjs-util'
import {encodeFields, initFields} from "../helpers";
import * as TokenDb from './db/Token';

export const fields = [
  {
    name: 'owner',
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.addHexPrefix(v.toString('hex'))
  },
  {
    name: 'tokenId', require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(ethUtil.stripHexPrefix(v)),
    decode: v => v.toString()
  },
  {
    name: 'amount', require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => v.readUIntBE()
  },
  {
    name: 'block',
    int: true,
    default: 0,
    require: true,
    isRPL: true,
    encode: v => ethUtil.toBuffer(v),
    decode: v => ethUtil.bufferToInt(v)
  },
];

class TokenModel {
  constructor(data) {
    this.owner = null;
    this.tokenId = null;
    this.amount = null;
    this.block = null;

    initFields(this, fields, data || {})
  }

  getRlp() {
    let fieldName = '_rlp';
    if (this[fieldName]) {
      return this[fieldName]
    }
    let dataToEncode = encodeFields(this, fields, true);

    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }

  getJson() {
    return {
      owner: this.owner,
      tokenId: this.tokenId,
      amount: this.amount,
      block: this.block,
    }
  }

  async save() {
    const oldToken = await TokenModel.get(this.tokenId);
    await TokenDb.add(this.tokenId, this.getRlp());
    await TokenDb.addOwner(this.owner, this.tokenId);
    if (oldToken)
      await TokenDb.removeOwner(oldToken.owner, this.tokenId);
    return this;
  }

  static async get(tokenId) {
    const token = await TokenDb.get(tokenId);
    if (!token)
      return null;
    return new TokenModel(token);
  }

  static async getByOwner(address) {
    const tokens = await TokenDb.getOwner(address);
    return Promise.all(tokens.map(token => TokenModel.get(token)));
  }
  static async count(){
    return await TokenDb.count();
  }
}

export default TokenModel
