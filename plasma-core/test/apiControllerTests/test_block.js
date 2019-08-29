import { get, last } from "../../src/api/controllers/Block";
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

const BLOCK_NUMBERS_ARRAY = [
  { number: "0" },
  { number: "1" },
  { number: "2" },
  { number: "3" },
  { number: "-1" }
]

const minTransactionsInBlock = 1

describe("getBlock", () => {

  for ( let blockNumber of BLOCK_NUMBERS_ARRAY ) {
    const { number } = blockNumber;

    it(`Should get block number ${ number }`, async () => {
      const block = await get({ params: { number } }),
            { error } = block;

      if (error) throw new Error(error)

      expect( Boolean(block) ).to.be.true
    });
  }

})



describe("getLastBlock", () => {

  it(`Should get last block`, async () => {
    const block = await last(),
      { error } = block;

    if (error) throw new Error(error)

    expect(Boolean(block)).to.be.true
  });

})

