/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import db from '../../lib/db';

async function add(candidate, token) {
  const candidateStr = candidate instanceof Buffer ? candidate.toString('hex') : candidate;
  try {
    await db.hset('candidates', candidateStr, 0);
    await db.sadd(`candidates:${candidateStr}:${candidateStr}`, token);
    return candidate
  } catch (error) {
    return error.toString()
  }
}

async function remove(candidate, token) {
  try {
    await db.hdel('candidates', candidate);
    await db.srem(`candidates:${candidate}:${candidate}`, token);
    return candidate
  } catch (error) {
    return error.toString()
  }
}


async function vote(candidate, voter, token) {
  const candidateStr = candidate instanceof Buffer ? candidate.toString('hex') : candidate;
  const voterStr = voter instanceof Buffer ? voter.toString('hex') : voter;
  try {
    await db.hincrby('candidates', candidateStr, 1);
    await db.sadd(`candidates:${candidateStr}:${voterStr}`, token);
    await db.sadd(`candidates:${candidateStr}`, voterStr);

    return candidate

  } catch (error) {
    return error.toString()
  }
}

async function unVote(candidate, voter, token) {
  try {
    await db.srem(`candidates:${candidate}:${voter}`, token);
    await db.hincrby('candidates', candidate, -1);
    const count = await db.scard(`candidates:${candidate}:${voter}`);
    if (!count)
      await db.srem(`candidates:${candidate}`, voter);

    return candidate

  } catch (error) {
    return error.toString()
  }
}


async function get() {
  const result = await db.hgetall('candidates');
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
  return await db.smembers(`candidates:${candidate}:${voter}`);
}

export {
  add,
  remove,
  get,
  vote,
  unVote,
  getVoteTokens
}
