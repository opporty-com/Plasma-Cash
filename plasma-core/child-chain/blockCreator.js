'use strict'

import config from 'config'
import {logger} from 'lib/logger'
import {txMemPool} from 'child-chain/TxMemPool'
import redis from 'lib/storage/redis'
import contractHandler from 'root-chain/contracts/plasma'
import web3 from 'lib/web3'
import Block from 'child-chain/block'
import {createNewBlock} from 'child-chain'
import ethUtil from 'ethereumjs-util'
import {verify} from 'lib/bls'

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
    let blockDataToSig = ethUtil.bufferToHex(block.getRlp()).substr(2)
    let blockMerkleRootHash = ethUtil
      .addHexPrefix(block.merkleRootHash.toString('hex'))
    if (!(await verify(sig, config.plasmaNodeAddress, blockDataToSig))) {
      logger.error('Signature of block is incorrect')
      return undefined
    }
    await web3.eth.personal
      .unlockAccount(config.plasmaNodeAddress, config.plasmaNodePassword, 60)
    logger.info('Block submit #', blockNumber, blockMerkleRootHash)
    // let gas = await contractHandler.contract.methods
    //   .submitBlock(blockMerkleRootHash, blockNumber)
    //   .estimateGas({from: config.plasmaNodeAddress})
    await contractHandler.contract.methods
      .submitBlock(blockMerkleRootHash, blockNumber)
      .send({from: config.plasmaNodeAddress, gas: 500000})
    logger.info('Submitted block #', blockNumber)
    redis.setAsync('lastBlockSubmitted', blockNumber)
  }
}

const blockCreator = new BlockCreator({
  minTransactionsInBlock: 1,
})

export default blockCreator
