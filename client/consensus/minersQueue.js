import redis from 'lib/storage/redis'
import { logger } from 'lib/logger'

class MinersQueue {

  constructor() {
    this.miners = []
    this.currentMiner = {}
  }

  init() {
    this.resetMinersQueue()
  }

  async resetMinersQueue() {
    return new Promise((resolve) => {
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
            this.miners.push({ miner_key: `${key}`, address: miners[key] })
          }
          this.currentMiner = this.miners[this.miners.length-1]
          resolve(this.currentMiner)
        }
      })
    })
  };

  async addMiner(miner) {
    this.miners.unshift(miner)
    if (!this.currentMiner) {
      this.currentMiner = miner
    }
    return miner
  };

  async delMiner(miner) {

    return new Promise((resolve) => {
    
      if(typeof miner === 'string'){
        for(let i = 0; i<this.miners.length; i++){
          if(this.miners[i].address === miner){
            let miner_key = this.miners[i].miner_key
            redis.hdel('miners', miner_key, (error) => {
              if (error) { console.error(error.toString()); }
              else {
                for (let i = 0; i < this.miners.length; i++) {
                  if (this.miners[i].miner_key === miner_key) {
                    this.miners.splice(i, 1)
                  }
                }
                resolve(miner)
              }
            })
          }
        }
      } else {

        redis.hdel('miners', miner.miner_key, (error) => {
          if (error) { console.error(error.toString()); }
          else {
            for (let i = 0; i < this.miners.length; i++) {
              if (this.miners[i].miner_key === miner.miner_key) {
                this.miners.splice(i, 1)
              }
            }
            resolve(miner)
          }
        })
      }
    })

  }

  async delAllMiners() {
    return new Promise((resolve)=>{
      redis.del('miners', (error, result) => {
        if (error) { console.error(error.toString()) }
        else {
          resolve(result)
        }
      })
    })
  }

  async setNextMiner() {
  
    this.miners.unshift(this.currentMiner)
    this.miners.pop()
    this.currentMiner = this.miners[this.miners.length-1]
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
