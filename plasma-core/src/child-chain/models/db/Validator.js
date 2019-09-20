/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import redis from '../../lib/redis';

async function addToValidator(address) {
  try {
    return await redis.sadd('validators', address);
  } catch (error) {
    return error.toString()
  }
}

async function deleteFromValidator(address) {
  try {
    return await redis.srem('validators', address);
  } catch (error) {
    return error.toString()
  }
}

async function isValidator(address) {
  try {
    let result = await redis.smembers('validators');
    return result.includes(address)
  } catch (error) {
    return error.toString()
  }
}

async function getValidators() {
  return await redis.smembers('validators');
}

export {
  addToValidator,
  deleteFromValidator,
  isValidator,
  getValidators
}
