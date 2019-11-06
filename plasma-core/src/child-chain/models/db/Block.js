/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import db from '../../lib/db';

async function getLastNumber() {
  let lastBlock = await db.get('lastBlockNumber');
  if (!lastBlock) {
    await db.set('lastBlockNumber', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function setLastNumber(number) {
  await db.set('lastBlockNumber', number);
  return number;
}

async function getLastSubmittedNumber() {
  let lastBlock = await db.get('lastBlockSubmitted');
  if (!lastBlock) {
    await db.set('lastBlockSubmitted', 0);
    return 0
  }
  return parseInt(lastBlock)
}

async function incCommit(hash) {
  return await db.incr(`Block:${hash}`);
}

async function add(number, buffer) {
  return await db.hset(`block`, number,  buffer.toString('hex'));
}

async function get(number) {
  const data = await db.hget('block', number);
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
