import redis from 'lib/storage/redis'
import {logger} from 'lib/logger'
import config from 'config'
import crypto from 'crypto'

/** */
class ValidatorsQueue {
  constructor() {
    this.validators = []
    this.queue = []
    this.currentValidator = {}
    this.currentMaxDelegates = config.maxDelegates
    this.fixedHeight = 0
    this.rounds = 0
  }

  async init() {
    this.resetValidatorsQueue()
    this.fixedRounds = await redis.getAsync('fuxedRound') || 0
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
      await this.prepareValidators()
      return this.currentValidator
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

  async delAllValidators() {
    let answer
    try {
      answer = await redis.delAsync('validators')
      this.validators = []
    } catch (error) {
      return error.toString()
    }
    return answer
  }

  async prepareValidators() {
    let height = await redis.getAsync('lastBlockNumber')
    if (!height) {
      height = 0
    }
    if (this.currentMaxDelegates != config.maxDelegates) {
      this.currentMaxDelegates = config.maxDelegates
      this.fixedHeight = height
      // this.fixedRounds = this.rounds
    }
    height -= this.fixedHeight
    let rounds = this.rounds
    this.rounds = Math.floor(height / config.variableDelegatesLength)
    + (height % config.variableDelegatesLength > 0 ? 1 : 0)

    if (this.rounds - rounds === 1) {
      this.fixedRounds++
      await redis.setAsync('fixedRound', this.fixedRounds)
    }

    this.hungValidators = Object.assign([], this.validators)
    let currentSeed = crypto.createHash('sha256')
      .update(String(this.fixedRounds), 'utf8').digest()
    for (let i = 0, delCount = this.hungValidators.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        let newIndex = currentSeed[x] % delCount
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
