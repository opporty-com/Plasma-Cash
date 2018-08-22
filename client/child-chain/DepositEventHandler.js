'use strict';

import Web3 from 'web3';

import config from 'config';
import ethUtil from 'ethereumjs-util';
import web3 from 'lib/web3';
import redis from 'lib/storage/redis';
import { createDepositTransaction, checkTransaction } from 'child-chain';
import { logger } from 'lib/logger';
import { txMemPool, TxMemPool } from 'child-chain/TxMemPool';

let x = 0;
async function processDepositEvent(event){
  const { depositor, amount, depositBlock } = event.returnValues;
  const depositBlockIndexKey = 'tokenId' + depositBlock;
  const existingdepositBlockIndex = await redis.getAsync(depositBlockIndexKey);

  if (!existingdepositBlockIndex) 
    await redis.setAsync(depositBlockIndexKey, 1);  

  const tx = await createDepositTransaction(depositor, new Web3.utils.BN(amount), depositBlock);

  let txRlpEncoded = tx.getHash(true).toString('hex');
  const signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), config.plasmaOperatorAddress);

  tx.signature = signature;

  await  TxMemPool.acceptToMemoryPool(txMemPool, tx); 
  logger.info(' DEPOSIT#', x++, ' ', depositBlock);

}

export default processDepositEvent;
