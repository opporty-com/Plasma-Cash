/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import redis from '../../lib/redis';

async function add(candidate, token) {
  try {
    await redis.hset('candidates', candidate, 0);
    await redis.sadd(`candidates:${candidate}:${candidate}`, token);
    return candidate
  } catch (error) {
    return error.toString()
  }
}

async function remove(candidate, token) {
  try {
    await redis.hdel('candidates', candidate);
    await redis.srem(`candidates:${candidate}:${candidate}`, token);
    return candidate
  } catch (error) {
    return error.toString()
  }
}


async function vote(candidate, voter, token) {
  try {
    await redis.hincrby('candidates', candidate, 1);
    await redis.sadd(`candidates:${candidate}:${voter}`, token);
    await redis.sadd(`candidates:${candidate}`, voter);

    return candidate

  } catch (error) {
    return error.toString()
  }
}

async function unVote(candidate, voter, token) {
  try {
    await redis.srem(`candidates:${candidate}:${voter}`, token);
    await redis.hincrby('candidates', candidate, -1);
    const count = await redis.scard(`candidates:${candidate}:${voter}`);
    if (!count)
      await redis.srem(`candidates:${candidate}`, voter);

    return candidate

  } catch (error) {
    return error.toString()
  }
}


async function get() {
  const result = await redis.hgetall('candidates');
  let candidates = [];
  for (let i = 0; i < result.length; i += 2) {
    candidates.push({
      address: result[i],
      votes: result[i + 1]
    });
  }
  return candidates;
}

async function getVoteTokens(candidate, voter) {
  return await redis.smembers(`candidates:${candidate}:${voter}`);
}

export {
  add,
  remove,
  get,
  vote,
  unVote,
  getVoteTokens
}
