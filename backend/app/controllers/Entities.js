'use strict';

import Router from 'router';
const router = new Router();
import levelDB from 'lib/db';
import config from "../../config";
import ethUtil from 'ethereumjs-util'; 
const BN = ethUtil.BN;
import Block from 'lib/model/block';
const { prefixes: { utxoPrefix } } = config;

import { blockNumberLength } from 'lib/dataStructureLengths';

router.route('/block/:id')
  .get(async function(req, res, next) {
    
  })

module.exports = router;
