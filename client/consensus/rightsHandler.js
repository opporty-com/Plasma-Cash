import redis from 'lib/storage/redis'
import { strRandom } from 'lib/utils'
import { minersQueue } from 'consensus'

async function setMinersCandidate(address) {
  return new Promise((resolve, reject) => {
    let miner_key = strRandom()
    redis.hset('miners', miner_key, address, async (error) => {
      if (error) {
        console.error(error.toString());
        reject(error);
      }
      const miner = await minersQueue.addMiner({ miner_key: miner_key, address: address })      
      resolve(miner)
    })
  })
}

async function validateKeyForMining({ miner_key, address }) {
  return new Promise((resolve, reject) => {
    if(!miner_key && !address){
      console.log('wrong miner_key or address');
      reject(false)
    }

    redis.hget('miners', miner_key, (error, result) => {
      if (error) {
        console.error(error.toString())
        return false;
      }
      resolve((result === address))
    })
  })
}

async function validateAddressForMining(address) {
  return new Promise((resolve, reject) => {
    redis.hvals('miners', (error, result)=>{
      resolve(result.includes(address))
    })
  })
}

export { setMinersCandidate, validateKeyForMining, validateAddressForMining }
