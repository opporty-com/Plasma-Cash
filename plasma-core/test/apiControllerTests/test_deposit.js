import contractHandler from '../../src/root-chain/contracts/plasma'
import web3  from '../../src/root-chain/web3'
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect


const DATA_FOR_DEPOSIT = [{
      address: '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
      password: '123123123',
      amount: 1
    },{
      address: '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fd',
      password: '123123123',
      amount: 1
    },{
      address: '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fc',
      password: '123123123',
      amount: 1
}]

describe("deposit", () => {

  for ( let data of DATA_FOR_DEPOSIT ) {
    it(`Should get create deposit by address ${data.address}`, async () => {

      const gas = await contractHandler.contract.methods.deposit().estimateGas({from: data.address});
      console.log("GET GAS", gas)
      await web3.eth.personal.unlockAccount(data.address, data.password, 1000);
      console.log("UNLOCKED")
      const deposit = await contractHandler.createDeposit({ from: data.address, value: data.amount, gas: gas + 150000 }),
        isError = deposit instanceof Error;

      console.log( "Deposit token id ->", deposit.events.DepositAdded.returnValues.tokenId )
      if (isError) throw new Error(deposit)

      expect(deposit && !isError).to.be.true
    });
  }
})
