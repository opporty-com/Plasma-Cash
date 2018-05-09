'use strict';

const Web3 = require('web3');
const BN = Web3.utils.BN;
import config from "../../config";

import ethUtil from 'ethereumjs-util';
import RLP from 'rlp';
import levelDB from 'lib/db';
import web3 from 'lib/web3';

import { PlasmaTransaction } from 'lib/model/tx';

import { createDepositTransaction } from 'lib/tx';
import { logger } from 'lib/logger';
import txPool from 'lib/txPool';

async function processDepositEvent(event){
  const { depositor, amount, depositBlock, blockNumber } = event.returnValues;
  let depositBlockIndexKey = Buffer.concat([config.prefixes.tokenIdPrefix, ethUtil.toBuffer(depositBlock)]);

  try {
    const existingdepositBlockIndex = await levelDB.get(depositBlockIndexKey);
    return true;
  }
  catch (error) {
    if (error.type !== "NotFoundError"){
      throw error;
    }
    await levelDB.put(depositBlockIndexKey, Buffer.alloc(1, "0x01", "hex"))  
  }
  
  const tx = await createDepositTransaction(depositor, new Web3.utils.BN(amount), depositBlock);

  let txRlpEncoded = tx.getHash(true).toString('hex');
  const signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), config.plasmaOperatorAddress);

  tx.signature = signature;

  if (tx.validate()) {
    txPool.addTransaction(tx);
    logger.info('Create deposit transaction ', depositBlock);        
  }
  else {
    logger.error('Deposit TX error ');        
  }
}


export default processDepositEvent;
