'use strict'
import web3 from 'lib/web3'
import contractHandler from 'root-chain/contracts/plasma'
import ethUtil from 'ethereumjs-util'
import logger from 'lib/logger'
import redis from 'lib/storage/redis'
import Block from 'child-chain/block'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import {checkTransactionFields} from 'child-chain/validator/transactions'
import {depositEventHandler} from 'child-chain/eventsHandler'
import config from 'config'
import PlasmaTransaction from 'child-chain/transaction'
import {validateTxsFromPool} from 'child-chain/validator/validateTxsFromPool'
import {validatorsQueue} from 'consensus'

async function getBlock(blockNumber) {
  try {
    const block = await redis.getAsync(Buffer.from('block' + blockNumber))
    if (!block) {
      throw new Error('Block not found')
    }
    return new Block(block)
  } catch (error) {
    logger.info('ERROR ' + error.toString())
  }
  return null
}

async function submitBlock(address, blockHash) {
  let currentBlockNumber = await web3.eth.getBlockNumber()
  let blockNumber = currentBlockNumber + 1
  try {
    let gas = await contractHandler.contract.methods
      .submitBlock(blockHash, blockNumber)
      .estimateGas({from: config.plasmaNodeAddress})
    await contractHandler.contract.methods.submitBlock(blockHash, blockNumber)
      .send({from: config.plasmaNodeAddress, gas: gas + 15000})
    await redis.setAsync('lastBlockSubmitted', blockNumber)
  } catch (error) {
    return error.toString()
  }
  return 'ok'
}

async function createDeposit({address, amount}) {
  try {
    if (web3.utils.isAddress(ethUtil.keccak256(address))) {
      throw new Error('address is not defined')
    }
    let gas = await contractHandler.contract.methods.deposit()
      .estimateGas({from: address})
    let answer = await contractHandler.contract.methods.deposit()
      .send({from: address, value: amount, gas: gas + 15000})
    return depositEventHandler(answer.events.DepositAdded)
  } catch (error) {
    return error.toString()
  }
}

async function createNewBlock() {
  // Collect memory pool transactions into the block
  // should be prioritized
  let lastBlock = await getLastBlockNumberFromDb()
  let newBlockNumber = lastBlock + config.contractblockStep
  try {
    let {successfullTransactions, rejectTransactions} = await validateTxsFromPool()
    if (rejectTransactions.length > 0) {
      TxMemPool.removeRejectTransactions(rejectTransactions)
    }
    if (successfullTransactions.length === 0) {
      logger.info('Successfull transactions is not defined for this block')
      return false
    }
    let block = new Block({
      blockNumber: newBlockNumber,
      transactions: successfullTransactions,
    })
    logger.info('Holded block has ', block.transactions.length, ' transactions')
    let currentValidator = (await validatorsQueue.getCurrentValidator())
    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit')
      return false
    } else {
      logger.info('You address is current validator. Starting submit block...')
    }
    for (let tx of successfullTransactions) {
      await redis.hdel('txpool', tx.getHash())
    }
    await redis.setAsync('lastBlockNumber', block.blockNumber)
    await redis.setAsync('block' + block.blockNumber.toString(10),
      block.getRlp())
    console.log('BLOCK SUBMITTED', block.blockNumber.toString(10))
    let blockDataToSig = block.getRlp()
    let blockHash = ethUtil.hashPersonalMessage(blockDataToSig)
    let key = Buffer.from(config.plasmaNodeKey, 'hex')
    let sig = ethUtil.ecsign(blockHash, key)
    logger.info('New block created - transactions: ', block.transactions.length)
    return sig
  } catch (err) {
    logger.error('createNewBlock error ', err)
  }
}

async function getLastBlockNumberFromDb() {
  let lastBlock = await redis.getAsync('lastBlockNumber')

  if (!lastBlock) {
    redis.setAsync('lastBlockNumber', 0)
    lastBlock = 0
  } else {
    lastBlock = parseInt(lastBlock)
  }
  return lastBlock
}

async function createDepositTransaction(addressTo, tokenId) {
  let newOwner = ethUtil.addHexPrefix(addressTo)
  let txData = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    type: 'pay',
    newOwner,
  }
  let txWithoutSignature = new PlasmaTransaction(txData)
  let txHash = (txWithoutSignature.getHash(true))
  try {
    let msgHash = ethUtil.hashPersonalMessage(txHash)
    let key = Buffer.from(config.plasmaNodeKey, 'hex')
    let sig = ethUtil.ecsign(msgHash, key)
    txData.signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
  } catch (error) {
    console.log('error', error)
    return error.toString()
  }
  let transaction = createSignedTransaction(txData)
  checkTransactionFields(transaction)
  await TxMemPool.acceptToMemoryPool(txMemPool, transaction)
  return {success: true}
}

async function sendTransaction(transaction) {
  const {
    prevBlock,
    tokenId,
    type,
    newOwner,
    signature,
  } = transaction

  let txData = {
    prevHash: '0x123',
    prevBlock,
    tokenId,
    type,
    newOwner,
    signature,
  }
  let tx = new PlasmaTransaction(txData)
  checkTransactionFields(tx)
  await TxMemPool.acceptToMemoryPool(txMemPool, tx)
  return {success: true}
}

async function createTransaction(transaction) {
  const {
    prevBlock,
    tokenId,
    type,
    newOwner,
  } = transaction

  let txData = {
    prevHash: '0x123',
    prevBlock,
    tokenId,
    type,
    newOwner,
  }
  let txWithoutSignature = {}
  txWithoutSignature = new PlasmaTransaction(txData)
  let txHash = (txWithoutSignature.getHash(true))
  try {
    let sig = ethUtil.ecsign(ethUtil.hashPersonalMessage(txHash),
      Buffer.from(config.plasmaNodeKey, 'hex'))
    txData.signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    let transaction = createSignedTransaction(txData)
    return await TxMemPool.acceptToMemoryPool(txMemPool, transaction)
  } catch (error) {
    return error.toString()
  }
}

function createSignedTransaction(data) {
  let txData = {
    prevHash: ethUtil.toBuffer(ethUtil.addHexPrefix(data.prevHash)),
    prevBlock: data.prevBlock,
    tokenId: data.tokenId,
    type: data.type,
    newOwner: data.newOwner,
    signature: data.signature,
  }
  return new PlasmaTransaction(txData)
}

export {
  getBlock,
  createDeposit,
  createNewBlock,
  submitBlock,
  getLastBlockNumberFromDb,
  createDepositTransaction,
  createSignedTransaction,
  createTransaction,
  sendTransaction,
}
