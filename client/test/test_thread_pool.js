
'use strict';

const chai = require('chai');
const FixedThreadPool = require('../lib/thread-pool')
let expect = chai.expect;

let simpleThreadPool = new FixedThreadPool(5)

describe('thread-pool', () => {

  it('should returns the result', () => {

    let dataStr = 'it is a result'

    simpleThreadPool.submit(testFunction, { str: dataStr })
      .then((result) => {
        expect(result).to.equal(dataStr)
      }).catch(() => {
        expect(false).to.be.true;
      })

  });

  it('should catch the reject', () => {

    let dataStr = 'error'

    simpleThreadPool.submit(testFunction, { str: dataStr })
      .then(() => {
        expect(false).to.be.true;
      }).catch(error => {
        expect(error.message).to.equal(dataStr)
      })

  });


  it('should handles 10 parallel computations', () => {
    let counter = 0
    for (let a = 0; a < 10; a++) {
      simpleThreadPool.submit(testFunction, { str: `result № ${a}` })
        .then(() => {
          counter++
          if (counter === 10) {
            expect(counter).to.equal(10)
          }
        }).catch(error => {
          console.error('Get the error', error);
        })
    }
  });
});


let testFunction = (data) => {
  return new Promise((resolve, reject) => {
    if (data.str === 'error')
      reject({ message: data.str, error: true })
    else
      resolve(data.str)
  })
}

