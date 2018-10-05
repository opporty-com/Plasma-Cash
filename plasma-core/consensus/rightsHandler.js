import redis from 'lib/storage/redis'
import { strRandom } from 'lib/utils'
import { validatorsQueue } from 'consensus'

class RightsHandler {

  static async setValidatorsCandidate(address) {
    return new Promise(async (resolve, reject) => {
      let validator_key = strRandom()
      try {
        await redis.hsetAsync('validators', validator_key, address)
        const validator = await validatorsQueue.addValidator({ validator_key: validator_key, address: address })
        resolve(validator)
      } catch (error) {
        reject(error.toString)
      }
    })
  }

  static async validateAddressForValidating(address) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await redis.hvalsAsync('validators')
        resolve(result.includes(address))
      } catch (error) {
        reject(error.toString())
      }
    })
  }
}
export { RightsHandler }
