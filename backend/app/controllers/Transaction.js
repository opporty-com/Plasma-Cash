'use strict';

import Router from 'router';
const router = new Router();
import levelDB from 'lib/db';
import { logger } from 'lib/logger';
import ethUtil from 'ethereumjs-util';

import ValidateMiddleware  from 'lib/validate';
import { createSignedTransaction, getUTXO } from 'lib/tx';
import { getBlock } from 'lib/helpers/block';

import txPool from 'lib/txPool';

import { createDeposits } from 'lib/test';
import TestTransactionsCreator from 'lib/txTestController';

router.route('/')
  .get(ValidateMiddleware('getTx'), async function(req, res, next) {
    try { 
      let { block: blockNumber, token_id, getHash } = req.formData;
      let block = await getBlock(blockNumber);      
      if (!block) {
        return next({status: 404, message: 'Block not Found'});
      }
      let tx = block.getTxByTokenId(token_id);
      if (!tx) {
        return next({status: 404, message: 'Tx not Found'});
      }
      
      tx = getHash ? tx.getHash().toString('hex') : tx.getJson();

      return res.json(tx);
    }
    catch(error){
      logger.error('accept signed tx error: ', error);
      next(error);
    }
  })

router.route('/proof')
  .get(ValidateMiddleware('getTx'), async function(req, res, next) {
    try { 
      let { block: blockNumber, token_id } = req.formData;
      let block = await getBlock(blockNumber);      
      if (!block) {
        return next({status: 404, message: 'Not Found'});
      }
      
      let proof = block.getProof(token_id, true)

      return res.json({ proof });
    }
    catch(error){
      next(error);
    }
  })
  .post(ValidateMiddleware('checkProof'), async function(req, res, next) {
    try { 
      let { block: blockNumber, hash, proof } = req.formData;

      let block = await getBlock(blockNumber);
      if (!block) {
        return next({status: 404, message: 'Not Found'});
      }
      
      let proofIsValid = block.checkProof(proof, hash);

      return res.json(proofIsValid);
    }
    catch(error){
      next(error);
    }
  })
  
router.route('/signed')
  .post(ValidateMiddleware('createSignedTX'), async function(req, res, next) {
    try { 
      let data = req.formData;
      let tx = await createSignedTransaction(data);
      
      if (!tx || !tx.validate()) {
        return res.json({error: true, message: "invalid transaction"});
      }
      let savedTx = await txPool.addTransaction(tx);
      if (!savedTx) {
        return res.json({error: true, message: "invalid transaction"});
      }
      return res.json(savedTx.getJson());
    }
    catch(error){
      logger.error('accept signed tx error: ', error);
      next(error);
    }
  })
    
router.route('/getHashToSign')
  .post(ValidateMiddleware('getHashToSign'), async function(req, res, next) {
    try { 
      let data = req.formData;
      let tx = await createSignedTransaction(data);
      let hashForSign = tx && ethUtil.addHexPrefix(tx.getHash(true).toString('hex'));

      return res.json(hashForSign);
    }
    catch(error){
      next(error);
    }
  })

router.route('/createTestDeposits')
  .post(function(req, res, next) {
    try { 
      let data = req.body;
      let count = data.count || null;
      return createDeposits({deposits: count})
        .then(ctreated => res.json({ ctreated }))
    }
    catch(error){
      next(error);
    }
  })

router.route('/createTestTransaction')
  .post(function(req, res, next) {
    try { 
      let data = req.body;
      let count = data.count || 1;
      return TestTransactionsCreator.createNewTransactions(count)
        .then(ctreated => res.json(ctreated && ctreated.getJson()))
    }
    catch(error){
      next(error);
    }
  })
    
module.exports = router;
