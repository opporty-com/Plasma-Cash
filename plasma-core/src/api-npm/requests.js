const axios = require('axios')
const contractHandler = require('./contract/plasma')
const config = require('./config')
const web3 = require('./lib/web3')


async function sendTransaction(transaction) {
  let result
  try {
    result = await axios.post(`${config.apiUrl}/transaction`, transaction)
  } catch (e) {
    throw new Error(e)
  }

  return result.data
}

async function deposit() {
  const { address, password } = config;

  try {
    console.log('[0]', address, password);
    const gas = await contractHandler.contract.methods.deposit().estimateGas({from: address})
    console.log("GAS ", gas)
    await web3.eth.personal.unlockAccount( address, password, 1000)
    console.log("ACCOUNT UNLOCKED ")
    const answer = await contractHandler.contract.methods.deposit().send({from: address, value:1, gas: gas + 1500000})
    console.log(" tokenId ", answer.events.DepositAdded.returnValues.tokenId)
    return answer.events.DepositAdded.returnValues.tokenId
  } catch (error) {
    throw new Error( error )
  }
}

async function getLastBlock() {
  let lastBlock
  try {
    lastBlock = (await axios.get(`${config.apiUrl}/block/last`)).data
  } catch (error) {
    throw new Error( error )
  }

  console.log(lastBlock)
  return lastBlock
}

module.exports = {
  sendTransaction,
  deposit,
  getLastBlock
}
