const PlasmaTransaction = require('./transaction')
const ethUtil = require('ethereumjs-util')
const {sendTransaction, deposit, balance, validator, candidates} = require('./requests')
const config = require('./config')

let actions = {
  deposit,
  balance,
  candidates,
  validator,
},
  txTypes = [
  'vote',
  'unvote',
  'pay',
  'candidate',
  'resignation',
],
  customTypes = [
  'deposit',
  'balance',
  'candidates',
  'validator',
]

async function comandHandler(command) {
  if(!txTypes.concat(customTypes).includes(command.type)){
    throw new Error('undefined command ' + '"' + command.type + '"')
  }
  if(customTypes.includes(command.type)){
    return await actions[command.type]()
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

function createTransaction({type, address, tokenId, blockNumber}) {
  if(type === 'unvote' || type === 'unvote'){
    if(!blockNumber) {
      throw new Error('Incorrect previous block number')
    }
  }
  if(type === 'pay'){
    if(!address){
      throw new Error('Incorrect address to')
    }
  }
  if(!tokenId){
    throw new Error('Incorrect tokenId')
  }
  let data = type === 'vote' || type === 'unvote' ? {address, blockNumber}
    : type === 'resignation' ? {blockNumber}
    : {}

  let txData = {
    prevHash: '0x123',
    prevBlock: 14,
    tokenId,
    type,
    data: JSON.stringify(data),
    newOwner: type === 'pay' ? address : config.stakeHolder,
  }
  let transaction = new PlasmaTransaction(txData)
  let signTransaction = createSignTransaction(transaction)
  return sendTransaction(signTransaction.getJson())
}

module.exports = {comandHandler}
