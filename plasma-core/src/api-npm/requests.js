const axios = require('axios')
const contractHandler = require('./contract/plasma')
const config = require('./config')
const web3 = require('../lib/web3')


async function sendTransaction(transaction) {
  let result
  try {
    console.log("1")
    result = await axios.post(`${config.apiUrl}/transaction`, transaction)
    console.log("2", result)
  } catch (e) {
    console.log("GOT ERROR", e.response.data)
    throw new Error(e)
  }

  return result.data
}

async function balance(address) {
  let result
  try {
    result = await axios.post(`${config.apiUrl}/getBalance`, {address})
  } catch (e) {
    console.log("GOT ERROR", e.response)
    throw new Error(e)
  }

  return result.data
}

async function deposit() {
  const { address, password } = config;

  try {
    console.log('[0]', address, password);
    
    await web3.eth.personal.unlockAccount( address, password, 1000)
    console.log('[1]');
    let gas = await contractHandler.contract.methods.deposit().estimateGas({from: address})
    console.log('[2]');
    let answer = await contractHandler.contract.methods.deposit().send({from: address, value:1, gas: gas + 1500000})
    console.log('[3]');
    return answer.events.DepositAdded.returnValues.tokenId
  } catch (error) {
    return error
  }
}

async function getLastBlock() {
  return (await axios.get(`${config.apiUrl}/block/last`)).data
}

module.exports = {
  sendTransaction,
  balance,
  deposit,
  getLastBlock
}
