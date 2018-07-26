const FixedThreadPool = require('../lib/thread-pool')

let simpleThreadPool = new FixedThreadPool(5)

let testFunction = (data) => {
  return new Promise((resolve, reject) => {
    resolve(data.str)
  })
}

for (let a = 0; a < 10; a++)
  simpleThreadPool.submit(testFunction, { str: `result № ${a}` })
    .then(result => {
      console.log('Getting the result:', result)
    })
