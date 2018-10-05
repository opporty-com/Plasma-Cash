'use strict'
import web3 from 'lib/web3'
import contractHandler from 'root-chain/contracts/plasma'
import {logger} from 'lib/logger'
import redis from 'lib/storage/redis'
import Block from 'child-chain/block'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import config from 'config'
import RLP from 'rlp'
import ethUtil from 'ethereumjs-util';
import PlasmaTransaction from 'child-chain/transaction';
import { validateTx } from 'child-chain/validator/validateTx'
import { validatorsQueue, RightsHandler } from 'consensus'

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
    let gas = await contractHandler.contract.methods.submitBlock(blockHash, blockNumber).estimateGas({from: config.plasmaOperatorAddress})
    await contractHandler.contract.methods.submitBlock(blockHash, blockNumber).send({from: config.plasmaOperatorAddress, gas: gas + 15000})
    await redis.setAsync('lastBlockSubmitted', blockNumber)
  } catch (error) {
    return error.toString()
  }

  return 'ok'
}

async function createDeposit({address, password, amount}) {
  return new Promise(async (resolve, reject) => {
    contractHandler.contract.events.DepositAdded(async (error, result) => {
      if (error) {
        reject(error.toString())
      }

      let {tokenId, blockNumber} = result.returnValues

      let addressToEncode = address.substr(2)
      let deposit = RLP.encode([addressToEncode, tokenId, amount, blockNumber])

      await redis.hsetAsync(`utxo_${address}`, tokenId, deposit)
      resolve(tokenId)
    })

    try {
      if (web3.utils.isAddress(ethUtil.keccak256(address))) {
        throw new Error('address is not defined')
      }

      await web3.eth.personal.unlockAccount(address, password, 60)
      let gas = await contractHandler.contract.methods.deposit().estimateGas({from: address})
      await contractHandler.contract.methods.deposit().send({from: address, value: amount, gas: gas + 15000})
    } catch (error) {
      reject(error.toString())
    }
  })
}

async function createNewBlock() {
  // Collect memory pool transactions into the block
  // should be prioritized
  try {
    let lastBlock = await getLastBlockNumberFromDb()
    let newBlockNumber = lastBlock + config.contractblockStep

    let transactions = await txMemPool.txs()

    let { successfullTransactions } = await validateTx()

    const block = new Block({
      blockNumber: newBlockNumber,
      transactions: successfullTransactions
    });

    if (!(await RightsHandler.validateAddressForValidating(config.plasmaOperatorAddress))) {
      logger.error('You address is not included in the validators queue')
      return false
    }
    let currentValidator = (await validatorsQueue.getCurrentValidator()).address

    if (!(currentValidator === config.plasmaOperatorAddress)) {
      logger.info('You address is in the validator queue. Please wait your turn to submit')
      return false
    } else {
      logger.info('You address is current validator. Starting submit block...')
    }

    for (let utxo of block.transactions) {
      try {
        let newHistory = {
          prev_hash: utxo.getHash(),
          prev_block: newBlockNumber
        }

        await redis.hdelAsync('history', utxo.token_id)
        await redis.hsetAsync('history', utxo.token_id, JSON.stringify(newHistory))

      } catch (error) {
        return error.toString()
      }
      //del from pool
      await redis.hdel('txpool', utxo.getHash());
    }

    await redis.setAsync('lastBlockNumber', block.blockNumber)
    await redis.setAsync('block' + block.blockNumber.toString(10), block.getRlp())

    logger.info('New block created - transactions: ', block.transactions.length)

    validatorsQueue.setNextValidator()

    return block;
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

function createDepositTransaction(addressTo, amountBN, tokenId) {
  let txData = {
    prev_hash: '',
    prev_block: 0,
    tokenId,
    new_owner: ethUtil.addHexPrefix(addressTo),
  }

  return new PlasmaTransaction(txData)
}

async function createTransaction(tokenId, addressFrom, addressTo) {
  let tokenHistory
  let utxo
  // fields for first transaction with new token
  let prev_hash = '0x123'
  let prev_block = '-1'

  utxo = await redis.hgetAsync(`utxo_${addressFrom}`, tokenId)

  try {
    tokenHistory = await redis.hgetAsync('history', tokenId)
  } catch (error) {
    return error.toString()
  }

  if (!utxo) {
    return 'undefined token id'
  }

  if (tokenHistory) {
    prev_hash = tokenHistory.prev_hash
    prev_block = tokenHistory.prev_block
  }

  let txData = {
    prev_hash,
    prev_block,
    tokenId,
    new_owner: addressTo,
  }

  let tx = new PlasmaTransaction(txData)

  let txHash = (tx.getHash(true)).toString('hex')

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
    prev_hash: ethUtil.toBuffer(ethUtil.addHexPrefix(data.prev_hash)),
    prev_block: data.prev_block,
    token_id: data.token_id,
    new_owner: data.new_owner,
    signature: data.signature,
  }

  return new PlasmaTransaction(txData)
}

function checkTransaction(tx) {
  if (!tx.new_owner || !tx.signature || !tx.tokenId) {
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
            token_id: utxoFromRLP[1],
            amount: utxoFromRLP[2],
            block_number: utxoFromRLP[3],
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
      console.error(error)
      reject(error)
    }
  })
}

async function getAllUtxosWithKeys(options = {}) {
  return await new Promise((resolve, reject) => {
    redis.keys('utxo*', function(err, res) {
      let res3 = res.map(function(el) {
        return Buffer.from(el)
      })
      if (res3.length) {
        redis.mget(res3, function(err2, res2) {
          let utxos = res2.map(function(el) {
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
    if (transaction.prev_block == 0) {
      let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase())
      let valid = address == config.plasmaOperatorAddress.toLowerCase()

      if (!valid) {
        return false
      }
    } else {
      let utxo = await getUTXO(transaction.prev_block, transaction.token_id)
      if (!utxo) {
        return false
      }
      transaction.prev_hash = utxo.getHash()
      let address = ethUtil.addHexPrefix(transaction.getAddressFromSignature('hex').toLowerCase())
      let utxoOwnerAddress = ethUtil.addHexPrefix(utxo.new_owner.toString('hex').toLowerCase())

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
