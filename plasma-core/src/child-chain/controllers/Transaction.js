/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */
import ethUtil from 'ethereumjs-util'
import {sign} from '../helpers';
import TransactionModel from '../models/Transaction';
import TokenModel from '../models/Token';
import p2pEmitter from "../lib/p2p";

async function send(transaction) {
  const tx = await add(transaction);
  p2pEmitter.sendNewTransaction(tx.getRlp());
  return tx.getJson();
}

async function add(transaction) {
  let tx = new TransactionModel(transaction);
  const isValid = await tx.isValid();
  if (!isValid) throw new Error('The transaction is not valid');
  await tx.pushToPool();
  return tx;
}

async function deposit({depositor: owner, tokenId, amount, blockNumber}) {
  let newOwner = ethUtil.addHexPrefix(owner);
  let transaction = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    type: 'pay',
    newOwner,
  };
  let txWithoutSignature = new TransactionModel(transaction);
  let hash = txWithoutSignature.getHash(true);
  try {
    transaction.signature = sign(hash)
  } catch (error) {
    throw new Error(error.toString())
  }
  let tx = await add(transaction);

  return tx;
}

async function getPool(json) {
  return await TransactionModel.getPool(json);
}

async function get(hash) {
  hash = hash.startsWith("0x") ? hash.slice( 2 ) : hash
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
  getPool,
  count
}
