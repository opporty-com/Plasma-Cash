import redis from 'lib/storage/redis'
import { logger } from 'lib/logger'
import config from 'config'
import crypto from 'crypto'

/** */
class ValidatorsQueue {

  constructor() {
    this.validators = []
    this.queue = []
    this.currentValidator = {}
  }

  init() {
    this.resetValidatorsQueue()
  }

  async resetValidatorsQueue() {

    let validators
    try {
      validators = await redis.hgetallAsync('validators')
    } catch (error) {
      return error.toString()
    }

    if (!validators) {
      logger.error('Validators queue initialized with empty queue')
      return false
    }

    else {
      this.validators = []
      for (let key in validators) {
        this.validators.push({ validator_key: `${key}`, address: validators[key] })
      }
      await this.prepareValidators()
      return this.currentValidator
    }
  };

  async addValidator(validator) {
    this.validators.push(validator)
    return validator
  };

  async delValidator(validator) {

    if (typeof validator === 'string') {
      for (let i = 0; i < this.validators.length; i++) {
        if (this.validators[i].address === validator) {
          let validator_key = this.validators[i].validator_key

          try {
            await redis.hdel('validators', validator_key)
          }
          catch (error) {
            return error.toString()
          }

          for (let i = 0; i < this.validators.length; i++) {
            if (this.validators[i].validator_key === validator_key) {
              this.validators.splice(i, 1)
            }
          }
          return validator
        }
      }
    } else {

      try {
        await redis.hdel('validators', validator.validator_key)
      }
      catch (error) { return error.toString() }

      for (let i = 0; i < this.validators.length; i++) {
        if (this.validators[i].validator_key === validator.validator_key) {
          this.validators.splice(i, 1)
        }
      }
      return validator
    }
  }

  async delAllValidators() {

    let answer

    try {
      answer = await redis.del('validators')
    }
    catch (error) { return error.toString() }

    return answer
  }

  async prepareValidators() {

    let height = await redis.getAsync('lastBlockNumber');

    if (!height) {
      height = 0
    }

    let seedSource = String(Math.floor(height / config.maxDelegates) + (height % config.maxDelegates > 0 ? 1 : 0));

    var currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest();
    for (var i = 0, delCount = this.validators.length; i < delCount; i++) {
      for (var x = 0; x < 4 && i < delCount; i++ , x++) {
        var newIndex = currentSeed[x] % delCount;
        var b = this.validators[newIndex];
        this.validators[newIndex] = this.validators[i];
        this.validators[i] = b;
      }
    }

    return 'ok';
  }

  async getCurrentValidator() {

    let dateStamp = Date.now()
    let index = Math.floor((dateStamp / config.blockTime) % (this.validators.length))
    return this.validators[index]
  }

  async getAllValidators() {
    return this.validators
  }
}

const validatorsQueue = new ValidatorsQueue()

validatorsQueue.init()

export { validatorsQueue }
