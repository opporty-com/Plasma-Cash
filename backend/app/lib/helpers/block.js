'use strict';

import redis from 'lib/redis';
import config from "../../../config";

import Block from 'lib/model/block';

async function getBlock(blockNumber) {
  try {
    let key = config.prefixes.blockPrefix + blockNumber;
    let data = await redis.getAsync(new Buffer(key));

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
