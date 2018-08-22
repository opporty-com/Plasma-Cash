import redis from 'lib/storage/redis'
import ethUtil from 'ethereumjs-util';
import { minersQueue } from 'consensus'

async function setMinersCandidate(private_key) {

  let miner_key = ethUtil.generateAddress()

  redis.hset('miners', miner_key, private_key, (error) => {
    if (error) {
      console.error(error.toString());
      return false;
    }
    return minersQueue.addMiner({ miner_key, private_key })
  })
}

async function validateKeyForMining(miner_key, private_key) {

  redis.hget('miners', miner_key, (error, result) => {
    if (error) {
      console.error(error.toString())
      return false;
    }
    return (result === private_key)
  })
}

export { setMinersCandidate, validateKeyForMining }
