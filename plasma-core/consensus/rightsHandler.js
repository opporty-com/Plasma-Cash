import redis from 'lib/storage/redis'
import {validatorsQueue} from 'consensus'

/** Class representing a Rights handler. */
class RightsHandler {
  static async setValidatorsCandidate(address) {
    try {
      await redis.saddAsync('validators', address)
      const validator = await validatorsQueue.addValidator(address)
      return validator
    } catch (error) {
      return error.toString()
    }
  }

  static async validateAddressForValidating(address) {
    try {
      let result = await redis.smembersAsync('validators')
      return result.includes(address)
    } catch (error) {
      return error.toString()
    }
  }
}
export {RightsHandler}
