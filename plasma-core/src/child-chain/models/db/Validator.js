/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import db from '../../lib/db';

async function add(address) {
  const addressStr = address instanceof Buffer ? address.toString('hex') : address;
  try {
    return await db.sadd('validators', addressStr);
  } catch (error) {
    return error.toString()
  }
}

async function remove(address) {
  const addressStr = address instanceof Buffer ? address.toString('hex') : address;
  try {
    return await db.srem('validators', addressStr);
  } catch (error) {
    return error.toString()
  }
}

async function isValidator(address) {
  const addressStr = address instanceof Buffer ? address.toString('hex') : address;
  try {
    let result = await db.smembers('validators');
    return result.includes(addressStr)
  } catch (error) {
    return error.toString()
  }
}

async function get() {
  return await db.smembers('validators');
}

export {
  add,
  remove,
  isValidator,
  get
}
