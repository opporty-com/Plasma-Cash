const redis = require('../../lib/redis')
const FixedThreadPool = require('./thread-pool')

let threadPool = new FixedThreadPool(5)

redis.set('testSpeedKey', 'testData', (error, res) => {
  if (error) {
    console.error(error.toString())
  }
  console.log('Redis set: ', res)
})

speedTestWork()
speedNoWork()

async function speedTestWork() {
  console.time('Worker time for 1000 computations');
  let promises = []
  for (let a = 0; a < 1000; a++) {
    promises.push(threadPool.submit(speedTestFunc, {str: 'hello'}).catch(err => {
      if (err) {
        console.log(err);
      }
    }))
  }

  await Promise.all(promises);
  console.timeEnd('Worker time for 1000 computations')
}

async function speedNoWork() {
  console.time('NoWorker time for 1000 computations');
  let promises = []
  let that = {}
  that.counter = 0
  for (let a = 0; a < 1000; a++) {
    promises.push(speedTestFunc({ rowData: { str: 'hello' }, redis: redis })
      .catch(err => {
        if (err) {
          console.log(err)
        }
      }))
  }

  await Promise.all(promises)
  console.timeEnd('NoWorker time for 1000 computations')
}

function speedTestFunc(data) {
  return new Promise((resolve, reject) => {
    if (data.redis) {
      data.redis.get('testSpeedKey', (err, res) => {
        if (err) {
          console.log('Redis error', err)
        }
        resolve(res)
      })
    }
  })
}
