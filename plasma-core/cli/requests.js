const axios = require('axios')
const contractHandler = require('./contract/plasma')
const config = require('./config')
const web3 = require('./lib/web3')


async function sendTransaction(transaction) {
  return (await axios.post('http://localhost:30313/Tx/sendTransaction', {transaction})).data
}

async function balance(address) {
  return (await axios.post('http://localhost:30313/getBalance', {address})).data
}

async function validator() {
  return (await axios.get('http://localhost:30313/getCurrentValidator')).data
}

async function candidates() {
  return (await axios.get('http://localhost:30313/getAllCandidates')).data
}

async function validators() {
  return (await axios.get('http://localhost:30313/getCandidates')).data
}

async function deposit() {
  try {
    console.log('[0]', config.address, config.password);
    
    await web3.eth.personal.unlockAccount(config.address, config.password, 1000)
    console.log('[1]');
    let gas = await contractHandler.contract.methods.deposit()
    .estimateGas({from: config.address})
    console.log('[2]');
    let answer = await contractHandler.contract.methods.deposit()
    .send({from: config.address, value: 1, gas: gas + 1500000})
    console.log('[3]');
    return answer.events.DepositAdded.returnValues.tokenId
  } catch (error) {
    return error
  }
}

module.exports = {
  sendTransaction,
  balance,
  deposit,
  candidates,
  validator,
  validators,
}
