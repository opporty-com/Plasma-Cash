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
import {validateTx} from 'child-chain/validator/validateTx'
import {validatorsQueue, RightsHandler} from 'consensus'
import {sign} from 'lib/bls'

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

async function makeStakeEvent({voter, candidate, value}) {
  try {
    await web3.eth.personal.unlockAccount(voter, config.plasmaNodePassword, 60)
    let gas = await contractHandler.contract.methods.addStake(candidate)
      .estimateGas({from: voter})
    let answer = await contractHandler.contract.methods.addStake(candidate)
      .send({from: voter, value: value, gas: gas + 15000})
    let returnValues = answer.events.StakeAdded.returnValues
    let stake = {
      voter: returnValues.voter,
      candidate: returnValues.candidate,
      value: +returnValues.value,
    }
    return stake
  } catch (error) {
    return error
  }
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
  try {
    let lastBlock = await getLastBlockNumberFromDb()
    let newBlockNumber = lastBlock + config.contractblockStep
    let {successfullTransactions, rejectTransactions} = await validateTx()
    const block = new Block({
      blockNumber: newBlockNumber,
      transactions: successfullTransactions,
    })
    let blockDataToSig = ethUtil.bufferToHex(block.getRlp()).substr(2)
    let signature = await sign(config.plasmaNodeAddress, blockDataToSig)
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
      await redis.hdel('txpool', utxo.getHash())
    }
    if (rejectTransactions.length > 0) {
      await redis.hsetAsync('rejectTx', newBlockNumber,
        JSON.stringify(rejectTransactions))
    }
    await redis.setAsync('lastBlockNumber', block.blockNumber)
    await redis.setAsync('block' + block.blockNumber.toString(10),
      block.getRlp())
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

async function createDepositTransaction(addressTo, tokenId) {
  let txData = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    newOwner: ethUtil.addHexPrefix(addressTo),
  }
  let txWithoutSignature = new PlasmaTransaction(txData)
  let txHash = (txWithoutSignature.getHash(true)).toString('hex')
  try {
    txData.signature = await web3.eth.sign(txHash, config.plasmaNodeAddress)
  } catch (error) {
    return error.toString()
  }
  let transaction = createSignedTransaction(txData)
  return transaction
}

async function createTransaction(tokenId, addressFrom, addressTo) {
  let tokenHistory
  let utxo
  try {
    utxo = await redis.hgetAsync(`utxo_${addressFrom}`, tokenId)
    tokenHistory = await redis.hgetAsync('history', tokenId)
  } catch (error) {
    return error.toString()
  }
  if (!utxo) {
    return 'undefined token id'
  }
  if (!tokenHistory.prevHash && !tokenHistory.prevBlock) {
    return 'undefined token history'
  }
  let txData = {
    prevHash: tokenHistory.prevHash,
    prevBlock: tokenHistory.prevBlock,
    tokenId,
    newOwner: addressTo,
  }
  let txWithoutSignature = new PlasmaTransaction(txData)
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
  makeStakeEvent,
}
