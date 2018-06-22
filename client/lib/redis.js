let redis = require('redis');
let client = redis.createClient({
  detect_buffers: true
});
let util = require('util');
const getAsync = util.promisify(client.get).bind(client);
const setAsync = util.promisify(client.set).bind(client);
const delAsync = util.promisify(client.get).bind(client);
client.getAsync = getAsync;
client.setAsync = setAsync;
client.delAsync = delAsync;
module.exports = client;
