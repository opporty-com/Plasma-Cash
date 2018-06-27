'use strict';

import { logger } from 'lib/logger';
import redis from 'lib/redis';
import Block from 'lib/model/block';

async function getBlock(blockNumber) {
  try {
    const block = await redis.getAsync(Buffer.from('block' + blockNumber));
    if (!block)
      throw new Error('Block not found');

    return new Block(block);
  }
  catch(error) {
    logger.info("ERROR" + error.toString());
  }
  return null;
}

export { getBlock };
