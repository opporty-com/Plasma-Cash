'use strict';

import ethUtil from 'ethereumjs-util';
import levelDB from 'lib/db';
const BN = ethUtil.BN;
import config from "../../config";

import { blockNumberLength } from 'lib/dataStructureLengths';

import Block from 'lib/model/block';

async function getBlock(blockNumber) {
  try {
    let blockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(blockNumber)), blockNumberLength)
    let key = Buffer.concat([config.prefixes.blockPrefix, blockNumberBuffer]);
    let data = await levelDB.get(key);

    return new Block(data);
  }
  catch(error) {
    if (error.type !== "NotFoundError"){
      throw error;
    }
    return null;
  }
}

module.exports = {
  getBlock
};
