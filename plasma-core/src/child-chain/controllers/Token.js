/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import TokenModel from '../models/Token';
import TransactionModel from '../models/Transaction';
import ethUtil from "ethereumjs-util";



async function get(tokenId) {
  if(!tokenId) throw new Error("Token not found")
  const token = await TokenModel.get(tokenId);
  if ( !token ) throw new Error("Token not found")
  return token.getJson();
}

async function getByAddress(address) {
  const owner = ethUtil.addHexPrefix(address);
  const tokens = await TokenModel.getByOwner(owner);
  return tokens.map(token => token.getJson());
}

async function getTransactions(tokenId) {
  const transactions = await TransactionModel.getByToken(tokenId);
  return transactions.map(tx => tx.getJson());
}
async function getLastTransaction(tokenId) {
  const tx = await TransactionModel.getLastByToken(tokenId);
  if(!tx) throw new Error("Transaction not found");
  return tx.getJson();
}

async function count(){
  return await TokenModel.count();
}
export {
  get,
  getByAddress,
  getTransactions,
  getLastTransaction,
  count
}
