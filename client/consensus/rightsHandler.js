import redis from 'lib/storage/redis'
import { strRandom } from 'lib/utils'
import { minersQueue } from 'consensus'

async function setMinersCandidate(private_key) {
  return new Promise((resolve, reject) => {

    let miner_key = strRandom()
    redis.hset('miners', miner_key, private_key, async (error) => {
      if (error) {
        console.error(error.toString());
        reject(error);
      }
      const miner = await minersQueue.addMiner({ miner_key: miner_key, private_key: private_key })
      resolve(miner)
    })
  })
}

async function validateKeyForMining({ miner_key, private_key }) {
  return new Promise((resolve, reject) => {

    redis.hget('miners', miner_key, (error, result) => {
      if (error) {
        console.error(error.toString())
        return false;
      }
      resolve((result === private_key))
    })
  })
}

export { setMinersCandidate, validateKeyForMining }
