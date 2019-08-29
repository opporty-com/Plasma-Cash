import {get, getByAddress, getLastTransaction, getTransactions as getTrxByToken} from "../../src/api/controllers/Token";
import chai from 'chai';
import chai_things from 'chai-things'
import {getByAddress as getBalance} from "../../src/api/controllers/Token";
chai.should()
chai.use(chai_things)
const expect = chai.expect

const TOKEN_ADDRESSES = [
  "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
  "0x11a618de3ade9b85cd811bf45af03bad481842ed",
  "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe",
  "0x4dc884abb17d11de6102fc1ef2cee0ebd31df248",
  "0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7"
]

const TOKEN_IDS = [
  "38394051746423491284794650327457176101352538180770591293205359966346140207386"
]

describe("getToken ( by address )", () => {

  for ( let address of TOKEN_ADDRESSES ) {
    it(`Should get token by address - ${ address }` , async () => {
      const balance = await getByAddress({ params: { address } }),
        { error } = balance;

      if (error) throw new Error(error)

      expect( Boolean(balance) ).to.be.true
    });
  }

})

describe("getToken ( by token id )", () => {

  for ( let tokenId of TOKEN_IDS ) {

    it(`Should get token by token id - ${ tokenId }`, async () => {
      const block = await get({ params: { tokenId } }),
        { error } = block;

      if (error) throw new Error(error)

      expect( Boolean(block) ).to.be.true
    });
  }

})


describe("getLastTransaction ( by token )", () => {
  for ( let tokenId of TOKEN_IDS ) {

    it(`Should get last transaction by token ${tokenId}`, async () => {
      const block = await getLastTransaction({params: {tokenId}}),
        {error} = block;

      if (error) throw new Error(error)

      expect(Boolean(block)).to.be.true
    });
  }
})

describe("getAllTransactions ( by token )", () => {
  for ( let tokenId of TOKEN_IDS ) {

    it(`Should get last transaction by token ${tokenId}`, async () => {
      const trxs = await getTrxByToken({params: {tokenId}}),
        {error} = trxs;

      if (error) throw new Error(error)

      expect(Boolean(trxs)).to.be.true
    });
  }
})
