//const web3 = require('../lib/web3')
import web3  from '../../root-chain/web3'
import contractHandler from '../../root-chain/contracts/plasma'
import config from '../config'

async function deposit({ amount }) {
  const { address,  password } = config,
    answerParams =  { from: address, value: amount },
    calcGas = gas => gas + 1500000;

  if ( !amount ) {
    console.log('amount is required! add -c, --amount')
    return process.exit(1);
  }

  console.log( "Deposit action running" )

  let answer
  try {
    const gas = await contractHandler.contract.methods.deposit().estimateGas({from: address});
    console.log( "DEPOSIT SUCCESS gas", gas )
    await web3.eth.personal.unlockAccount( address, password, 1000);
    console.log( "DEPOSIT SUCCESS unlockAccount" )
    answer = await contractHandler.contract.methods.deposit().send({ ...answerParams, gas: calcGas() });
    console.log( "Deposit token id ->", answer.events.DepositAdded.returnValues.tokenId )
  } catch (error) {
    console.log("Error: ", error)
  }

  process.exit(1)
}

export { deposit }
