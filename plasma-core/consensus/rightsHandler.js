import redis from 'lib/storage/redis'
import { validatorsQueue } from 'consensus'
import crypto from 'crypto'

class RightsHandler {

  static async setValidatorsCandidate(address) {

    let validatorKey = (await crypto.randomBytes(10).toString('hex'))
    
    try {
      await redis.hsetAsync('validators', validatorKey, address)
      const validator = await validatorsQueue.addValidator({ validatorKey: validatorKey, address: address })
      return validator
    } catch (error) {
      return error.toString()
    }
  }

  static async validateAddressForValidating(address) {
    
    try {
      let result = await redis.hvalsAsync('validators')
      return result.includes(address)
    } catch (error) {
      return error.toString()
    }
  }
}
export { RightsHandler }
