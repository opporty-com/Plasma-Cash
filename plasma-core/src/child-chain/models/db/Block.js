/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import redis from '../../lib/redis';

async function getLastNumber() {
  let lastBlock = await redis.get('lastBlockNumber');
  if (!lastBlock) {
    await redis.set('lastBlockNumber', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function setLastNumber(number) {
  await redis.set('lastBlockNumber', number);
  return number;
}

async function getLastSubmittedNumber() {
  let lastBlock = await redis.get('lastBlockSubmitted');
  if (!lastBlock) {
    await redis.set('lastBlockSubmitted', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function incCommit(hash) {
  return await redis.incr(`Block:${hash}`);
}

async function add(number, buffer) {
  return await redis.hset(`block`, number,  buffer.toString('hex'));
}

async function get(number) {
  const data = await redis.hget('block', number);
  if (!data) return null;
  return Buffer.from(data, 'hex');
}


export {
  getLastNumber,
  getLastSubmittedNumber,
  incCommit,
  add,
  get
}
