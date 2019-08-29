import {send, getPool, deposit, get as getTrxByHash} from "../../src/api/controllers/Transaction";
import chai from 'chai';
import chai_things from 'chai-things'
import ethUtil from "ethereumjs-util";
import {createSignTransaction} from "./helpers/transaction";
chai.should()
chai.use(chai_things)
const expect = chai.expect

const TRX_ARRAY = [{
  prevBlock: 1,
  prevHash: "0x123",
  tokenId: "38394051746423491284794650327457176101352538180770591293205359966346140207386",
  newOwner: "0x11a618de3ade9b85cd811bf45af03bad481842ed",
  type: "pay",
}];

const TRX_HASH = [
  "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
  "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
  "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
  "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70"
]

describe("createTransaction", () => {

  for ( let transaction of TRX_ARRAY ) {
    it(` Should create Transaction where prevBlock is ${ transaction.prevBlock }`, async () => {
      transaction.signature =  createSignTransaction( transaction )

      const trx = await send({ payload: transaction  } ),
            { error } = trx;

      if (error) throw new Error(error)

      expect( Boolean(trx) ).to.be.true
    })
  }

})

describe("getPool", () => {
    it(` Should get Pool  `, async () => {
      const poll = await getPool({ params: { hash: true } } ),
        { error } = poll;

      if (error) throw new Error(error)

      expect( Boolean(poll) ).to.be.true
    })

})

describe("getTransactions ( by hash )", () => {

  for ( let hash of TRX_HASH ) {
    it(` Should get transaction where hash is ${ hash }  `, async () => {
      const trx = await getTrxByHash({ params: { hash } } ),
        { error } = trx;

      if (error) throw new Error(error)

      expect( Boolean(trx) ).to.be.true
    })
  }


})
