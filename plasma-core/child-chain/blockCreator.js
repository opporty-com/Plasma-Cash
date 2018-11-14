'use strict'

import config from 'config'
import logger from 'lib/logger'
import {txMemPool} from 'child-chain/TxMemPool'
import redis from 'lib/storage/redis'
import contractHandler from 'root-chain/contracts/plasma'
import web3 from 'lib/web3'
import Block from 'child-chain/block'
import {createNewBlock} from 'child-chain'
import ethUtil from 'ethereumjs-util'
import {depositEventHandler} from 'child-chain/eventsHandler'
import {executeAllTxs} from 'child-chain/validator/transactions'
import PlasmaTransaction from 'child-chain/transaction'


/** class for Block periodical creating */
class BlockCreator {
  constructor(options = {}) {
    this.options = options || {}
  }

  start() {
    this.initBlockPeriodicalCreation()
    this.blockEventsCheck(null)
  }

  async initBlockPeriodicalCreation() {
    let poollen = await txMemPool.size()
    logger.info('Check the txPool: length ', poollen,
      'txs', this.options.minTransactionsInBlock)
    if (this.options.minTransactionsInBlock && poollen >=
        this.options.minTransactionsInBlock) {
      let sig = await createNewBlock()
      if (sig) {
        this.startBlockSubmittingToParent(sig)
      }
    }
    setTimeout(this.initBlockPeriodicalCreation.bind(this), config.blockPeriod)
  }

  async startBlockSubmittingToParent(sig) {
    try {
      let lastBlockInDatabase = await redis.getAsync('lastBlockNumber')
      lastBlockInDatabase = lastBlockInDatabase ?
        parseInt(lastBlockInDatabase) : 0
      let lastSubmittedBlock = await redis.getAsync('lastBlockSubmitted')
      lastSubmittedBlock = lastSubmittedBlock ? parseInt(lastSubmittedBlock) : 0
      logger.info('LastBlockInDb, LastSubmitted',
        lastBlockInDatabase, lastSubmittedBlock)
      if (lastBlockInDatabase >= lastSubmittedBlock) {
        let currentBlockInParent = await contractHandler.contract.methods
          .current_blk().call()
        if (currentBlockInParent != lastSubmittedBlock) {
          if (currentBlockInParent > lastSubmittedBlock) {
            await redis.setAsync('lastBlockSubmitted', currentBlockInParent)
          }
          lastSubmittedBlock += config.contractblockStep
          this.startBlockSubmit(lastSubmittedBlock, sig)
        } else {
          lastSubmittedBlock += config.contractblockStep
          this.startBlockSubmit(lastSubmittedBlock, sig)
        }
      }
    } catch (error) {
      logger.error('Submiting block error ', error)
    }
  }

  async blockEventsCheck(lastCheckedBlock) {
    let lastBlock
    if (lastCheckedBlock == null) {
      lastCheckedBlock = await redis.getAsync('lastEventProcessed')
      lastCheckedBlock = lastCheckedBlock ? parseInt(lastCheckedBlock) : 0
    }
    try {
      lastBlock = await web3.eth.getBlockNumber()
      const depositEventsInBlock = await contractHandler.contract.getPastEvents('DepositAdded', {
        fromBlock: lastCheckedBlock,
        toBlock: lastBlock,
      })
      if (depositEventsInBlock.length > 0) {
        for (let i = 0, length = depositEventsInBlock.length; i < length; ++i) {
          depositEventHandler(depositEventsInBlock[i])
        }
      }
      if (lastBlock > lastCheckedBlock) {
        lastCheckedBlock++
        logger.info('Process Block for Deposit Events - ', lastBlock)
        redis.setAsync('lastEventProcessed', lastBlock)
      }
    } catch (error) {
      logger.error('blockEventsCheck error ' + error)
      lastBlock = lastCheckedBlock
    }
    setTimeout(() => this.blockEventsCheck(lastBlock), 5000)
  }

  async startBlockSubmit(blockNumber, sig) {
    let blockKey = 'block' + blockNumber.toString(10)
    let block = new Block(await redis.getAsync(Buffer.from(blockKey)))
    logger.info('Submitted block #', blockNumber)
    redis.setAsync('lastBlockSubmitted', blockNumber)
    let blockHash = ethUtil.hashPersonalMessage(block.getRlp())
    let pubKey = ethUtil.ecrecover(blockHash, sig.v, sig.r, sig.s)
    let sigOwner = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey))
    if (sigOwner != config.plasmaNodeAddress) {
      logger.error('Signature of block is incorrect')
      return false
    }
    let blockMerkleRootHash = ethUtil
      .addHexPrefix(block.merkleRootHash.toString('hex'))
    logger.info('Block submit #', blockNumber, blockMerkleRootHash)
    try {
      let gas = await contractHandler.contract.methods
        .submitBlock(blockMerkleRootHash, blockNumber)
        .estimateGas({from: config.plasmaNodeAddress})
      await contractHandler.contract.methods
        .submitBlock(blockMerkleRootHash, blockNumber)
        .send({from: config.plasmaNodeAddress, gas})
    } catch (error) {
      logger.error('Error submit block in contract', error.toString())
    }
    logger.info('Block №' + blockNumber + ' executes...')
    executeAllTxs(block.transactions.map((el) => {
      return new PlasmaTransaction(el)
    }))
  }
}

const blockCreator = new BlockCreator({
  minTransactionsInBlock: 1,
})

export default blockCreator
