import redis from 'redis'
import util from 'util'
import logger from './logger'


import Redis from "ioredis"

const ioredis = new Redis("/var/run/redis/redis.sock");
// const ioredis = new Redis({
//   host: "redis",
//   port: 6379
// });


// const ioredis = new Redis.Cluster([{
//   host: "redis",
//   port: 6379
// }, {
//   host: "redis",
//   port: 6379
// }]);


let client = redis.createClient({
  detect_buffers: true,
  // return_buffers: true,
  path: "/var/run/redis/redis.sock"

});
// let pool = [client];
// for (let i = 0; i < 5; i++)
//   pool.push(client.duplicate());
//
// function* rPool() {
//   let cur = 0;
//   while (true) {
//     cur++;
//     if (cur >= pool.length) cur = 0;
//     yield pool[cur];
//   }
// }
//
// const redisPool = rPool();


client.on('connect', () => {
  logger.info('Redis storage has opened')
})

client.on('close', () => {
  logger.info('Redis storage has closed')
})


const getAsync = util.promisify(client.get).bind(client)
const setAsync = util.promisify(client.set).bind(client)
const delAsync = util.promisify(client.del).bind(client)
const incrAsync = util.promisify(client.incr).bind(client)
const lpushAsync = util.promisify(client.lpush).bind(client)
const rpushAsync = util.promisify(client.rpush).bind(client)
const lrangeAsync = util.promisify(client.lrange).bind(client)
const lremAsync = util.promisify(client.lrem).bind(client)
const llenAsync = util.promisify(client.llen).bind(client)
const lsetAsync = util.promisify(client.lset).bind(client)
const hexistsAsync = util.promisify(client.hexists).bind(client)

// const hsetAsync = util.promisify(client.hset).bind(client)


let pipeline = ioredis.pipeline();

let hsetData = {};
let promises = [];


function hset(key, hash, val) {

  return new Promise(async (resolve, reject) => {
    // pipeline.hset(key, hash, val);
    hsetData[hash] = val;
    promises.push({resolve, reject});

    if (promises.length >= 1) {
      let execHsetData = hsetData;
      let execPromises = promises;
      hsetData = {};
      promises = [];

      client.hmset(key, execHsetData, (err, results) => {
        if (err)
          for (let {reject} of execPromises)
            reject();

        for (let {resolve} of execPromises)
          resolve();

      });
    }
    // results.forEach((result, i) => {
    //   if (result[0])
    //     return execPromises[i].reject(result);
    //   execPromises[i].resolve(result);
    // });
  });

}

function hsetAsync(key, hash, val) {
  // return new Promise((resolve, reject) => {
  //   const redis = redisPool.next();
  //   redis.value.hset(key, hash, val, (err, res) => {
  //     if (err) return reject(err);
  //     resolve(res);
  //   })
  // });
  return hset(key, hash, val);
  return ioredis.hset(key, hash, val);
}


const hgetAsync = util.promisify(client.hget).bind(client)
const hgetallAsync = util.promisify(client.hgetall).bind(client)
const hdelAsync = util.promisify(client.hdel).bind(client)

// const hlenAsync = util.promisify(client.hlen).bind(client)


function hlenAsync(key) {
  // return new Promise((resolve, reject) => {
  //   const redis = redisPool.next().value;
  //   redis.hlen(key, (err, res) => {
  //     if (err) return reject(err);
  //     resolve(res);
  //   })
  // });
  return ioredis.hlen(key)
}


// function hlenAsync(key) {
//   return ioredis.hlen(key)
// }

const hvalsAsync = util.promisify(client.hvals).bind(client)
const hkeysAsync = util.promisify(client.hkeys).bind(client)
const hmgetAsync = util.promisify(client.hmget).bind(client)
const smembersAsync = util.promisify(client.smembers).bind(client)
const srandmemberAsync = util.promisify(client.srandmember).bind(client)
const sremAsync = util.promisify(client.srem).bind(client)
const saddAsync = util.promisify(client.sadd).bind(client)

client.getAsync = getAsync
client.setAsync = setAsync
client.delAsync = delAsync
client.incrAsync = incrAsync
client.lpushAsync = lpushAsync
client.llenAsync = llenAsync
client.rpushAsync = rpushAsync
client.lrangeAsync = lrangeAsync
client.lremAsync = lremAsync
client.lsetAsync = lsetAsync
client.hexistsAsync = hexistsAsync
client.hsetAsync = hsetAsync;
client.hdelAsync = hdelAsync
client.hgetAsync = hgetAsync
client.hgetallAsync = hgetallAsync
client.hlenAsync = hlenAsync
client.hvalsAsync = hvalsAsync
client.hkeysAsync = hkeysAsync
client.hmgetAsync = hmgetAsync
client.sremAsync = sremAsync
client.saddAsync = saddAsync
client.srandmemberAsync = srandmemberAsync
client.smembersAsync = smembersAsync

export default client
