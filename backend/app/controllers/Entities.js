'use strict';

import Router from 'router';
const router = new Router();
import levelDB from 'lib/db';
import contractHandler from 'lib/contracts/plasma';
import web3     from 'lib/web3';
import RLP from 'rlp';
import config from "../config";
const ethUtil = require('ethereumjs-util'); 
const BN = ethUtil.BN;

import Block from 'lib/model/block';
const { prefixes: { utxoPrefix } } = config;
import { PlasmaTransaction } from 'lib/model/tx';
import { getAllUtxos } from 'lib/tx';

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
      return res.json({error: true, reason: "invalid block number"});
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
      console.log('error', error);
    }
  })

router.route('/uxto')
  .get(async function(req, res, next) {
    try { 
      const uxtos = [];    
      const start = Buffer.concat([utxoPrefix, 
        Buffer.alloc(blockNumberLength),
        Buffer.alloc(tokenIdLength)
      ]);
      const end = Buffer.concat([utxoPrefix, 
        Buffer.from("ff".repeat(blockNumberLength), 'hex'),
        Buffer.from("9".repeat(tokenIdLength))]
      );
      
      let blockStart = utxoPrefix.length;
      let txStart = blockStart + blockNumberLength;
      let outputStart = txStart + tokenIdLength;
      
      levelDB.createReadStream({gte: start, lte: end})
        .on('data', function (data) {
          let tx = new PlasmaTransaction(data.value);
        
          let txJson = tx.getJson();
          txJson.blockNumber = ethUtil.bufferToInt(data.key.slice(blockStart, txStart))
          uxtos.push(txJson);
        })
        .on('error', function (error) {
            console.log('error', error);
        })
        .on('end', function () {
          res.json(uxtos);
        })
    }
    catch(error){
      console.log('error', error);
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
