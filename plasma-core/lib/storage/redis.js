import redis from 'redis'
import util from 'util'
import logger from 'lib/logger'

let client = redis.createClient({
  detect_buffers: true,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
})

client.on('connect', () => {
  logger.info('Redis storage has opened redis://' + process.env.REDIS_HOST )
})

client.on('close', () => {
  logger.info('Redis storage has closed')
})

const getAsync = util.promisify(client.get).bind(client)
const setAsync = util.promisify(client.set).bind(client)
const delAsync = util.promisify(client.del).bind(client)
const lpushAsync = util.promisify(client.lpush).bind(client)
const rpushAsync = util.promisify(client.rpush).bind(client)
const lrangeAsync = util.promisify(client.lrange).bind(client)
const lremAsync = util.promisify(client.lrem).bind(client)
const llenAsync = util.promisify(client.llen).bind(client)
const lsetAsync = util.promisify(client.lset).bind(client)
const hexistsAsync = util.promisify(client.hexists).bind(client)
const hsetAsync = util.promisify(client.hset).bind(client)
const hgetAsync = util.promisify(client.hget).bind(client)
const hgetallAsync = util.promisify(client.hgetall).bind(client)
const hdelAsync = util.promisify(client.hdel).bind(client)
const hlenAsync = util.promisify(client.hlen).bind(client)
const hvalsAsync = util.promisify(client.hvals).bind(client)
const smembersAsync = util.promisify(client.smembers).bind(client)
const srandmemberAsync = util.promisify(client.srandmember).bind(client)
const sremAsync = util.promisify(client.srem).bind(client)
const saddAsync = util.promisify(client.sadd).bind(client)

client.getAsync = getAsync
client.setAsync = setAsync
client.delAsync = delAsync
client.lpushAsync = lpushAsync
client.llenAsync = llenAsync
client.rpushAsync = rpushAsync
client.lrangeAsync = lrangeAsync
client.lremAsync = lremAsync
client.lsetAsync = lsetAsync
client.hexistsAsync = hexistsAsync
client.hsetAsync = hsetAsync
client.hdelAsync = hdelAsync
client.hgetAsync = hgetAsync
client.hgetallAsync = hgetallAsync
client.hlenAsync = hlenAsync
client.hvalsAsync = hvalsAsync
client.sremAsync = sremAsync
client.saddAsync = saddAsync
client.srandmemberAsync = srandmemberAsync
client.smembersAsync = smembersAsync

export default client
