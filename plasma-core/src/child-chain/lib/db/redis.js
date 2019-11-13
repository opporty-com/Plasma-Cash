import Redis from "ioredis"
import db from "./index";

export default (options = "/var/run/redis/redis.sock") => {
  const ioredis = new Redis(options);
  let hsetData = {};

  function hsetEval(data) {
    clearTimeout(data.timeout);
    data.timeout = null;
    data.isProcess = true;
    let execHsetData = {...data.data};
    let execPromises = [...data.promises];
    data.data = {};
    data.promises = [];
    data.isProcess = false;
    return ioredis.hmset(data.key, execHsetData, (err, results) => {
      if (err)
        for (let {reject} of execPromises)
          reject();

      for (let {resolve} of execPromises)
        resolve();

    });
  }

  function hsetAsync(key, hash, val) {
    if (!hsetData[key])
      hsetData[key] = {
        key,
        promises: [],
        data: {},
        timeout: null,
        isProcess: false
      };

    let data = hsetData[key];
    return new Promise((resolve, reject) => {
      data.data[hash] = val;
      data.promises.push({resolve, reject});

      if (!data.isProcess && data.timeout && data.promises.length >= 10000)
        return hsetEval(data);

      if (!data.timeout)
        data.timeout = setTimeout(() => hsetEval(data), 1000)

    });
  }

  async function hvalsasync(key, limit) {
    const data = await ioredis.hvals(key);
    if(!limit || data.length === 0 || limit < data.length)
      return data;
    return  data.slice(0, limit);
  }



  ioredis.hvalsasync = hvalsasync;
  ioredis.hsetAsync = hsetAsync;
  ioredis.hdelMany = ioredis.hdel;
  return ioredis
}
