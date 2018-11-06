'use strict'
import web3 from 'lib/web3'
import contractHandler from 'root-chain/contracts/plasma'
import ethUtil from 'ethereumjs-util'
import logger from 'lib/logger'
import redis from 'lib/storage/redis'
import Block from 'child-chain/block'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import {depositEventHandler} from 'child-chain/eventsHandler'
import config from 'config'
import RLP from 'rlp'
import PlasmaTransaction from 'child-chain/transaction'
import {validateTxsFromPool} from 'child-chain/validator/validateTxsFromPool'
import {validatorsQueue, RightsHandler} from 'consensus'
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
      for (let element of rejectTransactions) {
        await redis.hdel('txpool', element.transaction)
      }
    }
    if (successfullTransactions.length === 0) {
      logger.info('Successfull transactions is not defined for this block')
      return false
    }
    block.transactions = block.transactions.concat(successfullTransactions)
    for(let tx of successfullTransactions){
      await redis.hdel('txpool', tx.getHash())
    }
    logger.info('Holded block has ', block.transactions.length, ' transactions')
    if (!(await RightsHandler
      .validateAddressForValidating(config.plasmaNodeAddress))) {
      logger.error('You address is not included in the validators queue')
      return false
    }
    let currentValidator = (await validatorsQueue.getCurrentValidator())
    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit')
      return false
    } else {
      logger.info('You address is current validator. Starting submit block...')
    }
    let blockDataToSig = ethUtil.bufferToHex(block.getRlp()).substr(2)
    let signature = sign(config.plasmaNodeAddress, blockDataToSig)
    for (let utxo of block.transactions) {
      try {
        let newHistory = {
          prevHash: utxo.getHash(),
          prevBlock: newBlockNumber,
        }
        await redis.hdelAsync('history', utxo.tokenId)
        await redis.hsetAsync('history', utxo.tokenId,
          JSON.stringify(newHistory))
      } catch (error) {
        return error.toString()
      }
    }
    await redis.setAsync('lastBlockNumber', block.blockNumber)
    await redis.setAsync('block' + block.blockNumber.toString(10),
      block.getRlp())
    block = new Block({
      blockNumber: newBlockNumber,
      transactions: [],
    })
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
  let txHash = (txWithoutSignature.getHash(true)).toString('hex')
  let utxo = [
    newOwner.substr(2),
    tokenId,
    1,
    0,
  ]
  let tokenHistory = {
    prevHash: '0x123',
    prevBlock: utxo[3],
  }
  try {
    txData.signature = await web3.eth.sign(txHash, config.plasmaNodeAddress)
    await redis.hsetAsync(`utxo_${newOwner}`, tokenId, RLP.encode(utxo))
    await redis.hsetAsync('history', tokenId, JSON.stringify(tokenHistory))
  } catch (error) {
    return error.toString()
  }
  let transaction = createSignedTransaction(txData)
  return transaction
}

async function createTransaction(tokenId, addressFrom, addressTo, type, data) {
  let tokenHistory
  let utxo
  try {
    utxo = await redis.hgetAsync(`utxo_${addressFrom}`, tokenId)
    tokenHistory = JSON.parse(await redis.hgetAsync('history', tokenId))
  } catch (error) {
    return error.toString()
  }
  if (!utxo) {
    return 'undefined token id'
  }
  if (!tokenHistory.prevHash || tokenHistory.prevBlock<-2) {
    return 'undefined token history'
  }
  let txData = {
    prevHash: Buffer.from(tokenHistory.prevHash),
    prevBlock: tokenHistory.prevBlock,
    tokenId,
    type,
    data,
    newOwner: addressTo,
  }
  let txWithoutSignature = {}
  try {
    txWithoutSignature = new PlasmaTransaction(txData)
  } catch (error) {
    logger.error(error)
  }
  let txHash = (txWithoutSignature.getHash(true)).toString('hex')
  try {
    txData.signature = await web3.eth.sign(txHash, addressFrom)
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

function checkTransaction(tx) {
  if (!tx.newOwner || !tx.signature || !tx.tokenId) {
    return false
  }
  return true
}

async function getUTXO(blockNumber, tokenId) {
  let q = 'utxo_' + blockNumber.toString(16) + '_' + tokenId.toString()
  let data = await redis.getAsync(Buffer.from(q))
  if (data) {
    return new PlasmaTransaction(data)
  }
  return null
}
async function getAllUtxos(addresses) {
  return await new Promise(async (resolve, reject) => {
    try {
      let utxos = []

      for (let i = 0; i < addresses.length; i++) {
        let data = await redis.hvalsAsync(Buffer.from(`utxo_${addresses[i]}`))

        let utxoFromAddress = []

        for (let i = 0; i < data.length; i++) {
          let utxoFromRLP = (RLP.decode(data[i]).toString()).split(',')

          let utxo = {
            owner: ethUtil.addHexPrefix(utxoFromRLP[0]),
            tokenId: utxoFromRLP[1],
            amount: utxoFromRLP[2],
            blockNumber: utxoFromRLP[3],
          }
          utxoFromAddress.push(utxo)
        }

        utxos = utxos.concat(utxoFromAddress)
      }

      if (utxos) {
        resolve(utxos)
      } else {
        resolve([])
      }
    } catch (error) {
      reject(error)
    }
  })
}

async function getAllUtxosWithKeys(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', (err, res) => {
      let res3 = res.map((el) => {
        return Buffer.from(el)
      })
      if (res3.length) {
        redis.mget(res3, (err2, res2) => {
          let utxos = res2.map((el) => {
            let t = new PlasmaTransaction(el)
            if (options.json) {
              t = t.getJson()
            }
            return t
          })
          let result = {}
          for (let i in res3) {
            result[res3[i]] = utxos[i]
          }
          resolve(result)
        })
      } else {
        resolve([])
      }
    })
  })
}

async function checkInputs(transaction) {
  try {
    if (transaction.prevBlock == 0) {
      let address = ethUtil
        .addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase())
      let valid = address == config.plasmaNodeAddress.toLowerCase()

      if (!valid) {
        return false
      }
    } else {
      let utxo = await getUTXO(transaction.prevBlock, transaction.tokenId)
      if (!utxo) {
        return false
      }
      transaction.prevHash = utxo.getHash()
      let address = ethUtil
        .addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase())
      let utxoOwnerAddress = ethUtil.addHexPrefix(utxo.newOwner.toString('hex')
        .toLowerCase())
      if (utxoOwnerAddress != address) {
        return false
      }
    }
    return true
  } catch (e) {
    return false
  }
}

export {
  getBlock,
  createDeposit,
  createNewBlock,
  submitBlock,
  getLastBlockNumberFromDb,
  createDepositTransaction,
  createSignedTransaction,
  getUTXO,
  getAllUtxos,
  getAllUtxosWithKeys,
  checkTransaction,
  checkInputs,
  createTransaction,
}
