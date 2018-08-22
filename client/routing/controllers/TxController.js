'use strict';

import { logger } from 'lib/logger';
import { createSignedTransaction, checkTransaction } from 'child-chain';
import { txMemPool, TxMemPool } from 'child-chain/TxMemPool';
import ethUtil from 'ethereumjs-util';
import { testTransactionsCreator, createDeposits } from 'routing/txTestController';
import { getBlock } from 'child-chain/block';
import { parseM } from 'lib/utils';

class TxController {
  static async get(req, res) {
    await parseM(req);
    try { 
      let { block: blockNumber, token_id, getHash } = req.body;
      
      let block = await getBlock(blockNumber);      
      if (!block) {
        res.statusCode = 404;
        return res.end('Block not found');
      }

      let tx = block.getTxByTokenId(token_id);

      if (!tx) {
        res.statusCode = 404;
        return res.end('Tx not Found');
      }
      
      tx = getHash ? tx.getHash().toString('hex') : tx.getJson();

      return res.end(JSON.stringify(tx));
    } catch(error){
      res.statusCode = 404;
      return res.end( 'Error get tx'+error.toString() );
    }
  }
  
  static createTestTransaction(req, res) {
    let tx = testTransactionsCreator.alltransactions[parseInt(req.headers['test'])];
     return TxMemPool.acceptToMemoryPool(txMemPool, tx)
        .then(ctreated => {
          if (!ctreated) {
            res.statusCode = 400;
            return res.end();
          }
          return res.end(JSON.stringify(ctreated.getJson()));
        }).catch(function(e) {
          return res.end(e.toString())
      });
  }

  static async createTestDeposits(req, res) {
    await parseM(req);
    try {
      let data = req.body;
      let count = data.count || null;
      return createDeposits({deposits: count})
        .then(ctreated => res.end( ctreated.toString() ))
    } catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async getHashToSign(req, res) {
    await parseM(req);
    try {
      let data = req.body;
      let tx = await createSignedTransaction(data);
      let hashForSign = tx && ethUtil.addHexPrefix(tx.getHash(true).toString('hex'));

      return res.end(hashForSign);
    } catch(error) {
      res.end(error.toString());
    }
  }

  static async signed(req, res) {
    await parseM(req);

    try { 
      let data = req.body;
      let tx = await createSignedTransaction(data);

      if ( !tx || !checkTransaction(tx) ) {
        res.statusCode = 400;
        return res.end('invalid transaction');
      }

      let savedTx = await TXMemPool.acceptToMemoryPool(txMemPool, tx); 
      if (!savedTx) {
        res.statusCode = 400;
        return res.end('invalid transaction');
      }

      return res.end(savedTx.getJson());
    } catch (error) {
      return logger.error('accept signed tx error: ', error);
    }
  }
}

export default TxController;
