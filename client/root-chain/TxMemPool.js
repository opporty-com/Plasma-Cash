'use strict';

import { checkTransaction, checkInputs } from 'child-chain/child-chain';
import redis from 'lib/storage/redis';
import PlasmaTransaction  from 'child-chain/transaction';

/**
 * TxMemPool - stores valid transactions that may be included in the next block
 */
class TxMemPool {
  constructor () {
    this.newBlockNumber;
  }

  static async acceptToMemoryPool(pool, tx) {
    if (!checkTransaction(tx))
      throw new Error('acceptToMemoryPool: CheckTransaction failed');
    let hash = tx.getHash();

    if (await pool.exists(hash))
      return false;
    
    if (!(await checkInputs(tx)))
      return false;
    
    return pool.addTransaction(tx);
  }

  async exists(hash) {
    return (await redis.hexistsAsync('txpool', hash)) != '0';
  }

  async size() {
    return await redis.hlenAsync('txpool');
  }

  async remove(tx) {
    let hash = tx.getHash();
    return await redis.hdelAsync('txpool', hash);
  }

  async clear() {
    return await redis.delAsync('txpool');
  }

  async addTransaction(tx) {
    let hash = tx.getHash();
    redis.hset('txpool', hash, tx.getRlp(false));
    return tx;
  }

  async txs() {
    let transactions = await redis.hvalsAsync(Buffer.from('txpool'));

    if (transactions.length == 0) 
      return null;

    return transactions.map(function(el) {
      return new PlasmaTransaction(el);
    });
    
  }
};

const txMemPool = new TxMemPool();

export { txMemPool, TxMemPool };
