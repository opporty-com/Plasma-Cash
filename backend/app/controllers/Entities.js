'use strict';

import Router from 'router';
const router = new Router();
import levelDB from 'lib/db';
import contractHandler from 'lib/contracts/plasma';
import web3     from 'lib/web3';
import RLP from 'rlp';
import config from "../config";
import ethUtil from 'ethereumjs-util'; 
const BN = ethUtil.BN;

import Block from 'lib/model/block';
const { prefixes: { utxoPrefix } } = config;
import { PlasmaTransaction } from 'lib/model/tx';
import { getAllUtxos } from 'lib/tx';
import ValidateMiddleware  from 'lib/validate';

import {
  tokenIdLength,
  blockNumberLength
} from 'lib/dataStructureLengths';


router.route('/block/:id')
  .get(async function(req, res, next) {
    try { 
      const blockNumber = parseInt(req.params.id);
      if (!blockNumber){
          return res.json({error: true, reason: "invalid block number"});
      }

      const blockNumberBuffer = ethUtil.setLengthLeft(ethUtil.toBuffer(new BN(blockNumber)),blockNumberLength);
      const key = Buffer.concat([config.prefixes.blockPrefix, blockNumberBuffer]);
      const blockRlp = await levelDB.get(key);
      const block = new Block(blockRlp);
      let resJson = block.getJson();
      
      return res.json(resJson);
    }
    catch(error){
      if (error.notFound) {
        return next({status: 404, message: 'Not Found'});
      }
      next(error);
    }
  })


router.route('/deposit')
  .get(async function(req, res, next) {
    try { 
      const deposits = [];
      const start = Buffer.concat([config.prefixes.tokenIdPrefix, Buffer.alloc(1)]);
      const end = Buffer.concat([config.prefixes.tokenIdPrefix, Buffer.from("ff".repeat(1), 'hex')]);

      levelDB.createReadStream({gte: start, lte: end})
        .on('data', function (data) {
          deposits.push(data)
          
        })
        .on('error', function (error) {
            console.log('error', error)
        })
        .on('end', function () {
          res.json(deposits);
        })
    }
    catch(error){
      next(error);
    }
  })

router.route('/utxo')
  .get(ValidateMiddleware('getAllUtxos'), async function(req, res, next) {
    try { 
      let data = req.formData;    
      let options = {...data, json: true };
      let utxos = await getAllUtxos(options);
      
      res.json(utxos);
    }
    catch(error){
      next(error);
    }
  })
  

  router.route('/utxoCount')
    .get(async function(req, res, next) {
      try { 
        let count = 0;
        const start = Buffer.concat([utxoPrefix, 
          Buffer.alloc(blockNumberLength),
          Buffer.alloc(tokenIdLength)
        ]);
        const end = Buffer.concat([utxoPrefix, 
          Buffer.from("ff".repeat(blockNumberLength), 'hex'),
          Buffer.from("9".repeat(tokenIdLength))]
        );

        levelDB.createKeyStream({gte: start, lte: end})
          .on('data', function (data) {
            count++;
          })
          .on('error', function (error) {
              console.log('error', error);
          })
          .on('end', function () {
            res.json(count);
          })
      }
      catch(error){
        next(error);
      }
    })
      
module.exports = router;
