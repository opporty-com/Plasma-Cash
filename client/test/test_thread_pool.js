'use strict';

const chai = require('chai');
const FixedThreadPool = require('../lib/thread-pool')
let expect = chai.expect;

let simpleThreadPool = new FixedThreadPool(5)

describe('thread-pool', () => {

  it('should returns the result', async () => {

    let dataStr = 'it is a result'
    let result = await simpleThreadPool.submit(testFunction, { str: dataStr })
    expect(result).to.equal(dataStr)
  });

  it('should catch the reject',  () => {

    let dataStr = 'error'

    simpleThreadPool.submit(testFunction, { str: dataStr })
      .then(() => {
        
      }).catch(error => {
        expect(error.message).to.equal(dataStr)
      })
  });

  it('should handles 10 parallel computations', async () => {

    let counter = 0
    let promises = [];
    for (let a = 0; a < 10; a++) {
      promises.push(simpleThreadPool.submit( (data) => { return Promise.resolve(data.counter); } , { str: `result № ${a}`, counter:counter++ })); 
    }
    await Promise.all(promises);
    expect(promises.length).is.equal(10);

    expect(counter).is.equal(10);
  });

  after(async () => {
    simpleThreadPool.destroy()
  });
});

let testFunction = (data) => {
  return new Promise((resolve, reject) => {
    if (data.str === 'error')
      reject({ message: data.str, error: true })
    else{
      resolve(data.str)
    }
  })
}
