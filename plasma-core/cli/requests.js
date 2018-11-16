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
  return (await axios.get('http://localhost:30313/Validators/getCurrentValidator')).data
}

async function candidates() {
  return (await axios.get('http://localhost:30313/Validators/getCandidates')).data
}

async function deposit() {
  try {
    let account = await web3.eth.accounts.privateKeyToAccount('0x'+config.privateKey)
    let data = contractHandler.contract.methods.deposit().encodeABI()
    let tx = await account.signTransaction({
      from: config.address,
      to: config.plasmaContractAddress,
      value: 1,
      gas: 2800000,
      data,
    })
    let result = await web3.eth.sendSignedTransaction(tx.rawTransaction)
    return result.status
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
}
