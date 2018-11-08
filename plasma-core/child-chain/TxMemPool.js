'use strict'

import redis from 'lib/storage/redis'
import PlasmaTransaction from 'child-chain/transaction'
import logger from 'lib/logger'

/** TxMemPool - stores valid transactions that may
 * be included in the next block */
class TxMemPool {
  constructor() {
    this.newBlockNumber
  }

  static async acceptToMemoryPool(pool, tx) {
    let hash = tx.getHash()
    if (await pool.exists(hash)) {
      return 'this transaction is already exists'
    }
    return pool.addTransaction(tx)
  }

  async exists(hash) {
    return (await redis.hexistsAsync('txpool', hash)) != '0'
  }

  async size() {
    return await redis.hlenAsync('txpool')
  }

  async remove(tx) {
    let hash = tx.getHash()
    return await redis.hdelAsync('txpool', hash)
  }

  async clear() {
    return await redis.delAsync('txpool')
  }

  async addTransaction(tx) {
    let hash = tx.getHash()
    redis.hset('txpool', hash, tx.getRlp(false))
    return tx.getJson()
  }

  static async removeRejectTransactions(transactions) {
    for (let transaction of transactions) {
      await redis.hdel('txpool', transaction.hash)
    }
  }

  async txs(json) {
    let transactions = []

    try {
      transactions = await redis.hvalsAsync(Buffer.from('txpool'))
    } catch (error) {
      logger.error(error)
    }

    if (transactions.length == 0) {
      return []
    }
    if (json) {
      return transactions.map((el) => {
        return new PlasmaTransaction(el).getJson()
      })
    } else {
      return transactions.map((el) => {
        return new PlasmaTransaction(el)
      })
    }
  }
}

const txMemPool = new TxMemPool()

export {TxMemPool, txMemPool}
