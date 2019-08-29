import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

import contractHandler from "../../src/root-chain/contracts/plasma";
import web3 from "../../src/root-chain/web3";
import {get, last} from "../../src/api/controllers/Block";

import {getByAddress, getLastTransaction, getTransactions as getTrxByToken} from "../../src/api/controllers/Token";
import {getPool, get as getTrxByHash} from "../../src/api/controllers/Transaction";

const DEPOSIT_DATA = {
  address: '0x11a618de3ade9b85cd811bf45af03bad481842ed',
  password: '123123123',
  amount: 1
}

const GLOBAL_ENV = {
  tokenId: "",
  lastBlockNumber: "",
  tokenAddress: "",
  allTrxHash: []
}

describe("deposit", () => {


    it(`Should get create deposit by address ${DEPOSIT_DATA.address}`, async () => {

      const gas = await contractHandler.contract.methods.deposit().estimateGas({from: DEPOSIT_DATA.address});
      console.log("GET GAS", gas)
      await web3.eth.personal.unlockAccount(DEPOSIT_DATA.address, DEPOSIT_DATA.password, 1000);
      console.log("UNLOCKED")
      const deposit = await contractHandler.contract.methods.deposit().send({ from: DEPOSIT_DATA.address, value: DEPOSIT_DATA.amount, gas: gas + 150000 }),
        isError = deposit instanceof Error;

      GLOBAL_ENV.tokenId = deposit.events.DepositAdded.returnValues.tokenId
      console.log( "Deposit token id ->", GLOBAL_ENV.tokenId )
      if (isError) throw new Error(deposit)

      expect(deposit && !isError).to.be.true
    });

})

describe("getLastBlock", () => {

  it(`Should get last block`, async () => {
    const block = await last(),
      { error } = block;

    if (error) throw new Error(error)

    GLOBAL_ENV.lastBlockNumber = block.number
    console.log( "Last block number is ->", GLOBAL_ENV.lastBlockNumber )

    expect(Boolean(block)).to.be.true
  });

})

describe("getBlock ( 3 last blocks )", () => {

  const arrFromBlockNumbers = []

  let i = 0
  while ( arrFromBlockNumbers.length < GLOBAL_ENV.lastBlockNumber ) {
    arrFromBlockNumbers.push(i)
    i++
  }

  const lastNumbers = arrFromBlockNumbers.slice( -3 )


  for ( let blockNumber of lastNumbers ) {

    it(`Should get block number ${ blockNumber }`, async () => {
      const block = await get({ params: { number: blockNumber } }),
        { error } = block;

      if (error) throw new Error(error)

      expect( Boolean(block) ).to.be.true
    });
  }

})


describe("getToken ( by token id )", () => {
  const { tokenId } = GLOBAL_ENV;

  it(`Should get token ${ tokenId }`, async () => {
    const token = await get({ params: { tokenId } }),
      { error } = token;

    if (error) throw new Error(error)

    GLOBAL_ENV.tokenAddress = token.owner

    expect( Boolean( token) ).to.be.true
  });

})

describe("getToken ( by address )", () => {

    const { tokenAddress } = GLOBAL_ENV
    it(`Should get balance ${ tokenAddress }` , async () => {
      const token = await getByAddress({ params: { address: tokenAddress } }),
        { error } = token;

      if (error) throw new Error(error)

      expect( Boolean(token) ).to.be.true
    });

})

describe("getLastTransaction ( by token )", () => {
    const { tokenId } = GLOBAL_ENV;

    it(`Should get last transaction by token ${ tokenId }`, async () => {
      const block = await getLastTransaction({ params: { tokenId } }),
        { error } = block;

      if (error) throw new Error(error)

      expect( Boolean(block) ).to.be.true
    });

})

describe("getAllTransactions ( by token )", () => {
  const { tokenId } = GLOBAL_ENV;

  it(`Should get last transaction by token ${ tokenId }`, async () => {
    const trxs = await getTrxByToken({ params: { tokenId } }),
      { error } = trxs;

    if (error) throw new Error(error)

    GLOBAL_ENV.allTrxHash = trxs.map( i => i.hash )

    expect( Boolean(trxs) ).to.be.true
  });

})


describe("getPool", () => {
  it(` Should get Pool  `, async () => {
    const poll = await getPool({ params: { json: true } } ),
      { error } = poll;

    if (error) throw new Error(error)

    expect( Boolean(poll) ).to.be.true
  })

})

describe("getTransactions ( by hash )", () => {

  for ( let hash of GLOBAL_ENV.allTrxHash ) {
    it(` Should get transaction where hash is ${ hash }  `, async () => {
      const trx = await getTrxByHash({ params: { hash } } ),
        { error } = trx;

      if (error) throw new Error(error)

      expect( Boolean(trx) ).to.be.true
    })
  }


})


