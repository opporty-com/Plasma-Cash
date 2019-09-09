/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import * as RLP from 'rlp';
import ethUtil from 'ethereumjs-util'
import {encodeFields, initFields} from "../helpers";
import * as TokenDb from './db/Token';
import BaseModel from "./Base";

const fields = [
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

class TokenModel extends BaseModel {
  // owner = null;
  // tokenId = null;
  // amount = null;
  // block = null;

  constructor(data) {
    super(data, fields);
  }

  getBuffer() {
    return [
      this.owner,
      this.tokenId,
      this.amount,
      this.block,
    ]
  }

  getRlp() {
    let fieldName = '_rlp';
    if (this[fieldName]) {
      return this[fieldName]
    }
    const dataToEncode = this.getBuffer();

    this[fieldName] = RLP.encode(dataToEncode);
    return this[fieldName]
  }


  async save() {
    const tokenId = this.get('tokenId');
    const oldToken = await TokenModel.get(tokenId);
    await TokenDb.add(tokenId, this.getRlp());
    if (oldToken)
      await TokenDb.removeOwner(oldToken.get('owner'), tokenId);
    await TokenDb.addOwner(this.get('owner'), tokenId);
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

  static async count() {
    return await TokenDb.count();
  }
}

export default TokenModel
