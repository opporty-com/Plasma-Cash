import { createTransaction } from "../../api-npm";
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

const DATA = {
   delay: 500,
   count: 10,
   tokenId: "74606747508472834153939422909902043216245506461041191111419810376443146092084",
   address: "0xc124b6565191071e4a5108ee1248f25cfcbe4b24"
}

const decoratedCreateTransaction = createTransaction.bind( null, DATA.tokenId, DATA.address )

const promiseFromTimeout = i => new Promise( res =>  setTimeout( async () => {
  const result = await decoratedCreateTransaction( i );
  res( result )
}, DATA.delay ) )

const createIterationArray = count => {
    const iterationArray = []
    while ( count > 0 ) {
      iterationArray.push( count )
      count--
    }
    return iterationArray.reverse()
}

const runAll = async () => {
  const iterationArray = createIterationArray(DATA.count),
    resultArr = [];

  console.log(iterationArray)

  for ( let i of iterationArray ) {
    const result = await promiseFromTimeout( i )
    resultArr.push(result)
  }

  return resultArr
}

describe("createTransactionByDelaySync", () => {

  it(`Should create SYNC ${ DATA.count } transactions with ${ DATA.delay } delay`, async () => {
    const result = await runAll()

    console.log("END RESULT", result)
    expect(result).to.be.true
  })
})






