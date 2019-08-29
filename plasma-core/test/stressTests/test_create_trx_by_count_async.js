import { createTransaction } from "../../api-npm";
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

const DATA = {
  count: 10,
  tokenId: "74606747508472834153939422909902043216245506461041191111419810376443146092084",
  address: "0xc124b6565191071e4a5108ee1248f25cfcbe4b24"
}

const decoratedCreateTransaction = createTransaction.bind( null, DATA.tokenId, DATA.address )

const runAll = () => {
  const promises = []

  let i = 0;
  while ( i < DATA.count ) {
    const promise = decoratedCreateTransaction( i )
    promises.push(promise)
    i++
  }

  return promises
}


describe("createTransactionByСountAsync", () => {

  it(`Should create ASYNC ${ DATA.count } transactions `, async () => {
    const result = runAll(),
          res = await Promise.all( result )

    console.log("END RESULT", result, res)
    expect(result).to.be.true
  })
})


