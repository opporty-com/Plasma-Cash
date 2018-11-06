'use strict'
import web3 from 'lib/web3'
import contractHandler from 'root-chain/contracts/plasma'
import ethUtil from 'ethereumjs-util'
import logger from 'lib/logger'
import redis from 'lib/storage/redis'
import {Block, holdBlock, resetHoldBlock} from 'child-chain/block'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import {checkTransactionFields} from 'child-chain/validator/transactions'
import {depositEventHandler} from 'child-chain/eventsHandler'
import config from 'config'
import PlasmaTransaction from 'child-chain/transaction'
import {validateTxsFromPool} from 'child-chain/validator/validateTxsFromPool'
import {validatorsQueue} from 'consensus'
import {sign} from 'lib/bls'

let block = new Block({
  blockNumber: 0,
  transactions: [],
})

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

async function createDeposit({address, password, amount}) {
  try {
    if (web3.utils.isAddress(ethUtil.keccak256(address))) {
      throw new Error('address is not defined')
    }
    await web3.eth.personal.unlockAccount(address, password, 60)
    let gas = await contractHandler.contract.methods.deposit()
      .estimateGas({from: address})
    let answer = await contractHandler.contract.methods.deposit()
      .send({from: address, value: amount, gas: gas + 15000})
    depositEventHandler(answer.events.DepositAdded)
  } catch (error) {
    return error.toString()
  }
  return 'ok'
}

async function createNewBlock() {
  // Collect memory pool transactions into the block
  // should be prioritized
  let lastBlock = await getLastBlockNumberFromDb()
  let newBlockNumber = lastBlock + config.contractblockStep
  block.blockNumber = newBlockNumber
  try {
    let {successfullTransactions, rejectTransactions} = await validateTxsFromPool()
    if (rejectTransactions.length > 0) {
      await redis.hsetAsync('rejectTx', newBlockNumber,
        JSON.stringify(rejectTransactions))
      txMemPool.removeRejectTransactions(rejectTransactions)
    }
    if (successfullTransactions.length === 0) {
      logger.info('Successfull transactions is not defined for this block')
      return false
    }
    holdBlock.transactions = holdBlock.transactions.concat(successfullTransactions)
    for (let tx of successfullTransactions) {
      await redis.hdel('txpool', tx.getHash())
    }
    logger.info('Holded block has ', holdBlock.transactions.length, ' transactions')
    let currentValidator = (await validatorsQueue.getCurrentValidator())
    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit')
      return false
    } else {
      logger.info('You address is current validator. Starting submit block...')
    }
    let blockDataToSig = ethUtil.bufferToHex(holdBlock.getRlp()).substr(2)
    let signature = sign(config.plasmaNodeAddress, blockDataToSig)
    await redis.setAsync('lastBlockNumber', holdBlock.blockNumber)
    await redis.setAsync('block' + holdBlock.blockNumber.toString(10),
      holdBlock.getRlp())
    resetHoldBlock()
    logger.info('New block created - transactions: ', block.transactions.length)
    return signature
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

async function createDepositTransaction(addressTo, tokenId, blockNumber) {
  let newOwner = ethUtil.addHexPrefix(addressTo)
  let txData = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    type: 'pay',
    data: JSON.stringify({}),
    newOwner,
  }
  let txWithoutSignature = new PlasmaTransaction(txData)
  let txHash = (txWithoutSignature.getHash(true))
  try {
    let signature = ethUtil.essign(ethUtil.hashPersonalMessage(txHash),
      Buffer.from(config.plasmaNodeKey, 'hex'))
    txData.signature = ethUtil.toRpcSig(signature)
  } catch (error) {
    return error.toString()
  }
  let transaction = createSignedTransaction(txData)
  checkTransactionFields(transaction)
  await TxMemPool.acceptToMemoryPool(txMemPool, transaction)
  return {success: true}
}

async function sendTransaction(transaction) {
  checkTransactionFields(transaction)
  await TxMemPool.acceptToMemoryPool(txMemPool, transaction)
  return {success: true}
}

async function createTransaction(transaction) {
  const {
    prevHash,
    prevBlock,
    tokenId,
    type,
    data,
    newOwner,
  } = transaction

  let txData = {
    prevHash: Buffer.from(prevHash),
    prevBlock,
    tokenId,
    type,
    data: JSON.stringify(data),
    newOwner,
  }

  let txWithoutSignature = {}
  txWithoutSignature = new PlasmaTransaction(txData)
  let txHash = (txWithoutSignature.getHash(true))
  try {
    let signature = ethUtil.essign(ethUtil.hashPersonalMessage(txHash),
      Buffer.from(config.plasmaNodeKey, 'hex'))
    txData.signature = ethUtil.toRpcSig(signature)
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
    data: data.data,
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
