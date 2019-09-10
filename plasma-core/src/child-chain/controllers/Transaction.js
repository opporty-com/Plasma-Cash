/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import ethUtil from 'ethereumjs-util'
import {initFields, sign} from '../helpers';
import TransactionModel from '../models/Transaction';
import TokenModel from '../models/Token';
import p2pEmitter from "../lib/p2p";
import logger from "../lib/logger";
import BD from 'binary-data';
import {addTransaction} from '../models/db/TxMemPool';

let depositCount = 0;
let prevDepositCount = 0
setInterval(() => {
  logger.info(`Count deposit: ${depositCount} (${depositCount - prevDepositCount})`);
  prevDepositCount = depositCount;
}, 10000);


const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
  hash: BD.types.string(64),
};


async function send(transaction) {
  // p2pEmitter.sendNewTransaction(transaction);
  await add(transaction);
  depositCount++;
  return ethUtil.toBuffer('0x124');
  return tx.getJson();
}

async function add(transaction) {
  const packet = BD.decode(transaction, TransactionProtocol);
  await addTransaction(packet.hash, transaction);
  return

  let tx = transaction;
  if (!(transaction instanceof TransactionModel))
    tx = new TransactionModel(transaction);
  // logger.info(`Add transaction #${tx.getHash().toString('hex')} to pull`);
  const isValid = await tx.isValid();
  if (!isValid) throw new Error('The transaction is not valid');
  await tx.pushToPool();
  return tx;
}


async function demo(data) {

  depositCount++;

  let tx = new TransactionModel(data);


  return ethUtil.toBuffer('0x124');

}

async function deposit({depositor: owner, tokenId, amount, blockNumber, send}) {

  // logger.info(`receive new deposit token: ${tokenId} owner: ${owner}`);
  let newOwner = ethUtil.addHexPrefix(owner);
  let transaction = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    type: 'pay',
    newOwner,
  };
  let tx = new TransactionModel(transaction);
  let hash = tx.getHash(true);
  try {
    tx.set('signature', sign(hash));
  } catch (error) {
    throw new Error(error.toString())
  }
  tx = await add(tx);

  return {status: true};
}


async function getPool(json) {
  return await TransactionModel.getPool(json);
}

async function getPoolSize() {
  return await TransactionModel.getPoolSize();
}

async function get(hash) {
  hash = hash.startsWith("0x") ? hash.slice(2) : hash
  const tx = await TransactionModel.get(hash);
  if (!tx) throw new Error('The Transaction not found');
  return tx.getJson();
}


async function count() {
  return await TransactionModel.count();
}

export {
  send,
  add,
  get,
  deposit,
  demo,
  getPool,
  getPoolSize,
  count
}
