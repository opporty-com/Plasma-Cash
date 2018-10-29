import redis from 'lib/storage/redis'
import logger from 'lib/logger'
import config from 'config'
import crypto from 'crypto'

/** */
class ValidatorsQueue {
  constructor() {
    this.validators = []
    this.hungValidators = []
  }

  async init() {
    this.resetValidatorsQueue()
  }

  async resetValidatorsQueue() {
    let validators
    try {
      validators = await redis.smembersAsync('validators')
    } catch (error) {
      return error.toString()
    }
    if (!validators) {
      logger.error('Validators queue initialized with empty queue')
      return false
    } else {
      this.validators = []
      for (let key in validators) {
        this.validators.push(validators[key])
      }
      return await this.getCurrentValidator()
    }
  }

  async addValidator(validator) {
    this.validators.push(validator)
    return validator
  }

  async delValidator(validator) {
    redis.sremAsync('validators', validator)
    this.validators.splice(this.validators.indexOf(validator), 1)
    return 'ok'
  }

  async prepareValidators() {
    let seedData = Math.floor(Date.now()/config.roundInterval)
    this.hungValidators = Object.assign([], this.validators)
    let seedSource = crypto.createHash('sha256')
      .update(String(seedData), 'utf8').digest()
    for (let i = 0, delCount = this.hungValidators.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        let newIndex = seedSource[x] % delCount
        let b = this.hungValidators[newIndex]
        this.hungValidators[newIndex] = this.hungValidators[i]
        this.hungValidators[i] = b
      }
    }
    return 'ok'
  }

  async getCurrentValidator() {
    let dateStamp = Date.now()
    let index = Math.floor((dateStamp / config.blockTime) %
    (this.hungValidators.length))
    return this.hungValidators[index]
  }

  async getAllValidators() {
    return this.validators
  }
}

const validatorsQueue = new ValidatorsQueue()

validatorsQueue.init()

export {validatorsQueue}
