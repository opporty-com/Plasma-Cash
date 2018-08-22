import redis from 'lib/storage/redis'

class MinersQueue {

  constructor() {
    this.miners = []
  }

  async init() {
    this.resetMinersQueue()
  }

  async resetMinersQueue() {

    redis.hgetall('miners', (error, miners) => {
      if (error) {
        console.error(error.toString());
      }
      if (!miners) { return false }
      else {
        this.miners = miners
        return this.setNextMiner()
      }
    })
  };

  async addMiner(miner) {
    this.miners.unshift(miner)
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
    redis.hdelAll('miners', (error, result) => {
      if (error) { console.error(error.toString()) }
      else { return result }
    })
  }

  async setNextMiner() {
    this.miners.unshift(this.currentMiner)
    this.currentMiner = this.miners.pop()
    return this.currentMiner
  }

  async getCurrentMiner() {
    return this.currentMiner
  }

  async getAllMiners() {
    return this.miners
  }
}

const minersQueue = new MinersQueue()

minersQueue.init()

export { minersQueue }
