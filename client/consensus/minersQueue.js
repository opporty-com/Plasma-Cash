import redis from 'lib/storage/redis'
import { logger } from 'lib/logger'

class MinersQueue {

  constructor() {
    this.miners = []
  }

  init() {
    this.resetMinersQueue()
  }

  async resetMinersQueue() {

    redis.hgetall('miners', (error, miners) => {
      if (error) {
        console.error(error.toString());
      }
      if (!miners) {
        logger.error('Miners queue initialized with empty queue')
        return false
      }
      else {
        this.miners = []
        for (let key in miners) {
          this.miners.push({ miner_key: `${key}`, private_key: miners[key] })
        }
        this.currentMiner = this.miners[this.miners.length]        
      }
    })
  };

  async addMiner(miner) {
    this.miners.unshift(miner)
    if(!this.currentMiner){
      this.currentMiner = miner
    }
    return miner
  };

  async delMiner(miner) {

    redis.hdel('miners', miner.miner_key, (error) => {
      if (error) { console.error(error.toString()); }
      else {

        let indexOfMinerForDelete = this.miners.indexOf(miner)
        this.miners.splice(indexOfMinerForDelete, 1)
        return miner
      }
    })
  }

  async delAllMiners() {
    redis.del('miners', (error, result) => {
      if (error) { console.error(error.toString()) }
      else {
        return result
      }
    })
  }

  async setNextMiner() {
    this.miners.unshift(this.currentMiner)
    this.currentMiner = this.miners.pop()
    return this.currentMiner
  }

  async getCurrentMiner() {

    console.log('GET CURRENT MINER', this.currentMiner);
    return this.currentMiner
  }

  async getAllMiners() {
    return this.miners
  }
}

const minersQueue = new MinersQueue()

minersQueue.init()

export { minersQueue }
