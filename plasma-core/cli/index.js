const PlasmaTransaction = require('./transaction')
const ethUtil = require('ethereumjs-util')
const fs = require('./lib/fs')
const {sendTransaction, deposit, balance, validator, candidates} = require('./requests')
const config = require('./config')

let actions = {
  deposit,
  balance,
  candidates,
  validator,
  logout,
}
let txTypes = [
  'vote',
  'unvote',
  'pay',
  'candidate',
  'resignation',
]
let customTypes = [
  'deposit',
  'balance',
  'candidates',
  'validator',
  'logout',
]

async function comandHandler(command) {
  if (!config.privateKey || !config.privateKey) {
    throw new Error('Authentication has not been done')
  }
  if (!txTypes.concat(customTypes).includes(command.type)) {
    throw new Error('undefined command ' + '"' + command.type + '"')
  }
  if (customTypes.includes(command.type)) {
    return command.type === 'balance' ?
      await actions['balance'](command.tokenId) :
      await actions[command.type]()
  }
  return createTransaction(command)
}

function createSignTransaction(transaction) {
  let txHash = (transaction.getHash(true))
  let signature = ethUtil.ecsign(ethUtil.hashPersonalMessage(txHash),
    Buffer.from(config.privateKey, 'hex'))
  let rpcSig = ethUtil.toRpcSig(signature.v, signature.r, signature.s)
  transaction.signature = rpcSig
  return transaction
}

function createTransaction({type, address, tokenId, prevBlock}) {
  if (type != 'candidate' && type != 'resignation') {
    if (!address) {
      throw new Error('Incorrect address to')
    }
  } else {
    address = '0x'
  }
  if (!prevBlock) {
    throw new Error('Incorrect previous block number')
  }
  if (!tokenId) {
    throw new Error('Incorrect tokenId')
  }
  let txData = {
    prevHash: '0x123',
    prevBlock,
    tokenId,
    type,
    newOwner: address,
  }
  let transaction = new PlasmaTransaction(txData)
  let signTransaction = createSignTransaction(transaction)
  return sendTransaction(signTransaction.getJson())
}

async function authentication(privateKey, password) {
  let address = ethUtil
    .bufferToHex(ethUtil.privateToAddress(Buffer.from(privateKey, 'hex')))
  try {
    await logout()
    let data = await fs.readFileAsync('./config.js', 'utf8')
    let replace = data
      .replace("password: ''", `password: '${password}'`)
      .replace("privateKey: ''", `privateKey: '${privateKey}'`)
      .replace("address: ''", `address: '${address}'`)
    await fs.writeFileAsync('./config.js', replace, 'utf8')
  } catch (error) {
    return error.toString()
  }
  return 'Successful authentication ' + address
}

async function logout() {
  try {
    let data = await fs.readFileAsync('./config.js', 'utf8')
    let replace = data
      .replace(`password: '${config.password}'`, "password: ''")
      .replace(`privateKey: '${config.privateKey}'`, "privateKey: ''")
      .replace(`address: '${config.address}'`, "address: ''")
    await fs.writeFileAsync('./config.js', replace, 'utf8')
  } catch (error) {
    return error.toString()
  }
  return 'Logging out successfully'
}


module.exports = {comandHandler, authentication, logout}
