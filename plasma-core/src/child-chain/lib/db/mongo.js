import {MongoClient, GridFSBucket} from 'mongodb';

const DB_NAME = process.env.DB_NAME || 'plasma'
export default (options) => {
  const client = new MongoClient(options);
  let db;
  client.connect(function (err) {
    console.log(err);
    db = client.db(DB_NAME);
  });

  let hsetData = {};
  let hdelData = {};

  function hsetEval(data) {
    clearTimeout(data.timeout);
    data.timeout = null;
    data.isProcess = true;
    const collection = db.collection(data.collectionName);
    let execData = [...data.data];
    let execPromises = [...data.promises];
    data.data = [];
    data.promises = [];
    data.isProcess = false;
    return collection.insertMany(execData, (err, results) => {
      if (err)
        for (let {reject} of execPromises)
          reject();

      for (let {resolve} of execPromises)
        resolve();

    });
  }

  function hdelEval(data) {
    clearTimeout(data.timeout);
    data.timeout = null;
    data.isProcess = true;
    const collection = db.collection(data.collectionName);
    let execData = [...data.data];
    let execPromises = [...data.promises];
    data.data = [];
    data.promises = [];
    data.isProcess = false;
    return collection.deleteMany({_id: {$in: execData}}, (err, results) => {
      if (err)
        for (let {reject} of execPromises)
          reject();

      for (let {resolve} of execPromises)
        resolve();

    });
  }


  async function saveLargeData(key, data) {
    return new Promise((resolve, reject) => {
      const bucket = new GridFSBucket(db);
      // bucket.drop();
      const uploadStream = bucket.openUploadStreamWithId(key, key);
      uploadStream
        .once('error', (error) => {
          reject(error);
        })
        .once('finish', () => {
          resolve(key);
        });
      uploadStream.end(data);
    })
  }

  async function getLargeData(key) {
    return new Promise((resolve, reject) => {
      const bucket = new GridFSBucket(db);
      let result = "";
      const downloadStream = bucket.openDownloadStreamByName(key);

      downloadStream
        .once('error', (error) => {
          reject(error);
        })
        .on('data', (chunk) => {
          result += chunk;
        })
        .once('end', () => {
          downloadStream.destroy();
          resolve(result);
        });
    })
  }

  async function deleteLargeData(key) {
    return new Promise((resolve, reject) => {
      const bucket = new GridFSBucket(db);
      bucket.delete(key, function (error) {
        if (error)
          reject(error);
        resolve();
      })
    });
  }

  return {
    get: async function (key) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection('keys');
      const result = await collection.findOne({_id: key});
      return result && result.value;
    },
    set: async function (key, value) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection('keys');
      const result = await collection.updateOne({_id: key}, {$set: {value, _id: key}}, {upsert: true});
      return value;
    },
    del: async function (key) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection('keys');
      const result = await collection.deleteOne({_id: key});
      return key;
    },
    incr: async function (key, value = 1) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection('keys');
      const result = await collection.updateOne({_id: key}, {$inc: {value}});
      return key;
    },

    hget: async function (collectionName, key) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.findOne({_id: key});
      if (!result)
        return null;

      if (result.value)
        return result.value;

      return await getLargeData(key);
    },

    hgetall: async function (collectionName) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.find().toArray();

      return result.reduce((acc, cur) => {
        acc.push(cur._id);
        acc.push(cur.value);
        return acc
      }, []);
    },
    hincrby: async function (collectionName, key, value) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.updateOne({_id: key}, {"$inc": {value}});
      return key;
    },
    hset: async function (collectionName, key, value) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);

      let chunk = null;
      if (value.length > 10000000)
        try {
          chunk = await saveLargeData(key, value);
        } catch (e) {
          chunk = key;
        }


      let data = {_id: key};
      if (chunk)
        data.chunk = chunk;
      else
        data.value = value;
      const res = await collection.updateOne({_id: key}, {$set: data}, {upsert: true});
      return key;
    },
    hsetAsync: function (collectionName, key, value) {
      if (!db)
        throw "DB is not connect";

      if (!hsetData[collectionName])
        hsetData[collectionName] = {
          collectionName,
          promises: [],
          data: [],
          timeout: null,
          isProcess: false
        };

      let data = hsetData[collectionName];

      return new Promise((resolve, reject) => {
        data.data.push({value, _id: key});
        data.promises.push({resolve, reject});

        if (!data.isProcess && data.timeout && data.promises.length >= 10000)
          return hsetEval(data);

        if (!data.timeout)
          data.timeout = setTimeout(() => hsetEval(data), 1000)

      });
    },

    hdelMany: function (collectionName, key, value) {
      if (!db)
        throw "DB is not connect";

      if (!hdelData[collectionName])
        hdelData[collectionName] = {
          collectionName,
          promises: [],
          data: [],
          timeout: null,
          isProcess: false
        };

      let data = hdelData[collectionName];

      return new Promise((resolve, reject) => {
        data.data.push(key);
        data.promises.push({resolve, reject});

        if (!data.isProcess && data.timeout && data.promises.length >= 10000)
          return hdelEval(data);

        if (!data.timeout)
          data.timeout = setTimeout(() => hdelEval(data), 1000)

      });
    },
    // hsetAsync: async function (collectionName, key, value) {
    //   if (!db)
    //     throw "DB is not connect";
    //   const collection = db.collection(collectionName);
    //   const result = await collection.insertOne({value, _id: key});
    //
    //   return key;
    // },
    hexists: async function (collectionName, key) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.findOne({_id: key});
      return !!result;
    },

    hdel: async function (collectionName, key) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.findOne({_id: key});
      if (result) {

        if (result.chunk)
          await deleteLargeData(key);

        await collection.deleteOne({_id: key});
      }
      return key;
    },
    hlen: async function (collectionName) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const count = await collection.count();
      return count;
    },
    hvalsasync: async function (collectionName, limit = 0) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.find().limit(limit).toArray();
      return result.map(i => i.value);
    },

    smembers: async function (collectionName) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.find().toArray();
      return result.map(i => i.value);
    },
    scard: async function (collectionName) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const count = await collection.count();
      return count;
    },
    sadd: async function (collectionName, value) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.updateOne({value}, {$set: {value}}, {upsert: true});
      return value;
    },
    srem: async function (collectionName, value) {
      if (!db)
        throw "DB is not connect";
      const collection = db.collection(collectionName);
      const result = await collection.deleteOne({value});
      return value;
    },
  }
}
