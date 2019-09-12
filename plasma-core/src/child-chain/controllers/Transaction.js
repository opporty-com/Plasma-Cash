/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import ethUtil from 'ethereumjs-util'
import {initFields, sign} from '../helpers';
import TransactionModel, * as Transaction from '../models/Transaction';

import BD from 'binary-data';
import {addTransaction} from '../models/db/TxMemPool';


const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.string(),
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
  hash: BD.types.string(64),
};

async function deposit({depositor: owner, tokenId, amount, blockNumber}) {

  // logger.info(`receive new deposit token: ${tokenId} owner: ${owner}`);
  let tx = {
    prevHash: '0x123',
    prevBlock: ethUtil.intToBuffer(-1),
    tokenId,
    type: Transaction.TYPES.PAY,
    newOwner: ethUtil.toBuffer(ethUtil.addHexPrefix(owner)),
    dataLength: 0,
    data: new Buffer(0)
  };
  tx = Transaction.sign(tx);
  await add(tx);

  return {status: true};
}


async function add(tx) {
  const isValid = await Transaction.validate(tx);
  if (!isValid) throw new Error('The transaction is not valid');
  Transaction.pushToPool(tx);
  return tx;
}


async function send(transaction) {
  // p2pEmitter.sendNewTransaction(transaction);
  await add(transaction);
  depositCount++;
  return ethUtil.toBuffer('0x124');
  return tx.getJson();
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

async function getTransactionsByAddress(address) {
  const transactions = await TransactionModel.getByAddress(address);
  return transactions.map(tx => tx.getJson());
}

export {
  send,
  add,
  get,
  deposit,
  demo,
  getPool,
  getPoolSize,
  getTransactionsByAddress,
  count
}
