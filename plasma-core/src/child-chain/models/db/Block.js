/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import redis from '../../lib/redis';

async function getLastNumber() {
  let lastBlock = await redis.getAsync('lastBlockNumber');
  if (!lastBlock) {
    await redis.setAsync('lastBlockNumber', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function settLastNumber(number) {
  await redis.setAsync('lastBlockNumber', number);
  return number;
}

async function getLastSubmittedNumber() {
  let lastBlock = await redis.getAsync('lastBlockSubmitted');
  if (!lastBlock) {
    await redis.setAsync('lastBlockSubmitted', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function incCommit(hash) {
  return await redis.incrAsync(`Block:${hash}`);
}

async function add(number, blockRlp) {
  return await redis.hsetAsync(`block`, number, blockRlp);
}

async function get(number) {
  return await redis.hgetAsync(Buffer.from('block'), number);
}


export {
  getLastNumber,
  settLastNumber,
  getLastSubmittedNumber,
  incCommit,
  add,
  get
}
