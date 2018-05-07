'use strict';

import Router from 'router';
const router = new Router();
import levelDB from 'lib/db';
import { logger } from 'lib/logger';

import ValidateMiddleware  from 'lib/validate';
import { createSignedTransaction } from 'lib/tx';
import txPool from 'lib/txPool';

import { createDeposits } from 'lib/test';

router.route('/signed')
  .post(ValidateMiddleware('createSignedTX'), async function(req, res, next) {
    try { 
      let data = req.formData;
      let tx = await createSignedTransaction(data);
      
      if (!tx || !tx.validate()) {
        return res.json({error: true, reason: "invalid transaction"});
      }
      txPool.addTransaction(tx);

      return res.json(tx.getJson());
    }
    catch(error){
      logger.error('accept signed tx error: ', error);
      next(error);
    }
  })
  
router.route('/getRawToSign')
  .post(ValidateMiddleware('createSignedTX'), async function(req, res, next) {
    try { 
      let data = req.formData;
      let tx = await createSignedTransaction(data);
      
      return res.json(tx && tx.getHash(true).toString('hex'));
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
    
    
module.exports = router;
