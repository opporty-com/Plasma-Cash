import { logger } from '../lib/logger';
import { createSignedTransaction, getUTXO } from '../lib/tx';
import txPool from '../lib/txPool';
import { createDeposits } from '../lib/test';
import ethUtil from 'ethereumjs-util';
import TestTransactionsCreator from '../lib/txTestController';
import { getBlock } from '../lib/helpers/block';
import { parseM } from '../lib/utils';

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
    try { 
      return TestTransactionsCreator.createNewTransactions()
        .then(ctreated => {
          if (!ctreated) {
            res.statusCode = 400;
            return res.end();
          }
          return res.end(ctreated && ctreated.getJson());
        })
    }
    catch(error) {
      res.statusCode = 400;
      res.end();
    }
  }

  static async createTestDeposits(req, res) {
    await parseM(req);
    try { 
      let data = req.body;
      let count = data.count || null;
      console.log('count', count)
      return createDeposits({deposits: count})
        .then(ctreated => res.end( ctreated.toString() ))
    } catch(error) {
      res.statusCode = 400;
      res.end(error);
    }
  }

  static async getHashToSign(req, res) {
    try { 
      await parseM(req);
      let data = req.body;
      let tx = await createSignedTransaction(data);
      let hashForSign = tx && ethUtil.addHexPrefix(tx.getHash(true).toString('hex'));

      return res.end(hashForSign);
    } catch(error) {
      res.end(error.toString());
    }
  }

  static createTestTransactions(req, res) {
    try { 
      return TestTransactionsCreator.createNewTransactions()
        .then(ctreated => {
          if (!ctreated) {
            res.statusCode = 400;
            return res.end();
          }
          res.statusCode = 200;
          return res.end();
        })
    }
    catch(error) {
      next(error);
    }
  }

  static async signed(req, res) {
    await parseM(req);

    try { 
      let data = req.body;
      let tx = await createSignedTransaction(data);

      if (!tx || !tx.validate()) {
        res.statusCode = 400;
        return res.end('invalid transaction');
      }

      let savedTx = await txPool.addTransaction(tx);
      if (!savedTx) {
        res.statusCode = 400;
        return res.end('invalid transaction');
      }

      return res.end(savedTx.getJson());
    } catch (error) {
      return logger.error('accept signed tx error: ', error);
    }
  }

  static async proof(req, res) {
    await parseM(req);
    try { 
      let { block: blockNumber, token_id } = req.body;
      let block = await getBlock(blockNumber);
      if (!block) {
        res.statusCode = 404;
        return res.end('Not Found');
      }

      let proof = block.getProof(token_id, true)

      return res.end(JSON.stringify({ proof }));
    }
    catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async checkProof(req, res) {
    await parseM(req);
    try { 
      let { block: blockNumber, hash, proof } = req.body;

      let block = await getBlock(blockNumber);
      if (!block) {
        res.statusCode = 404;
        return res.end('Not Found');
      }
      
      let proofIsValid = block.checkProof(proof, hash);

      return res.end(JSON.stringify(proofIsValid));
    }
    catch(error){
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

}

export default TxController;
