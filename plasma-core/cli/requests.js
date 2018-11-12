const axios = require('axios')
const contractHandler = require('./contract/plasma')
const config = require('./config')
const web3 = require('./web3')

const sendTransaction = async (transaction) => {  
  return (await axios.post('http://localhost:30313/Tx/sendTransaction', { transaction })).data
}

const balance = async (address) => {
  return (await axios.post('http://localhost:30313/getBalance', { address })).data
}

const validator = async () => {
  return (await axios.get('http://localhost:30313/Validators/getCurrentValidator')).data
}

const candidates = async () => {
  return (await axios.get('http://localhost:30313/Validators/getCandidates')).data
}

const deposit = async () => {
  try {
    await web3.eth.personal.unlockAccount(config.address, config.password, 1000);
    let gas = await contractHandler.contract.methods.deposit()
    .estimateGas({ from: config.address })
    let answer = await contractHandler.contract.methods.deposit()
    .send({ from: config.address, value: 1, gas: gas + 1500000 })
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
  validator
}
