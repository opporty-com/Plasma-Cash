import redis from 'redis';
import util from 'util';

let client = redis.createClient( {
  detect_buffers: true
});

const getAsync = util.promisify(client.get).bind(client);
const setAsync = util.promisify(client.set).bind(client);
const delAsync = util.promisify(client.del).bind(client);
const lpushAsync = util.promisify(client.lpush).bind(client);
const rpushAsync = util.promisify(client.rpush).bind(client);
const lrangeAsync = util.promisify(client.lrange).bind(client);
const lremAsync = util.promisify(client.lrem).bind(client);
const llenAsync = util.promisify(client.llen).bind(client);
const lsetAsync = util.promisify(client.lset).bind(client);
client.getAsync = getAsync;
client.setAsync = setAsync;
client.delAsync = delAsync;
client.lpushAsync = lpushAsync;
client.llenAsync = llenAsync;
client.rpushAsync = rpushAsync;
client.lrangeAsync = lrangeAsync;
client.lremAsync = lremAsync;
client.lsetAsync = lsetAsync;

export default client;
