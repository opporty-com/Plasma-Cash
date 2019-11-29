import {promise as plasma} from "../lib/plasma-client";
import * as ethUtil from "ethereumjs-util";
import * as Token from "../helpers/Token";
import * as Transaction from "../helpers/Transaction";

async function get(tokenId) {
  const data = await plasma({action: "getToken", payload: {tokenId}});
  return Token.getJson(data);
}

async function getByAddress(address) {
  const data = await plasma({action: "getTokenByAddress", payload: {address: Buffer.from(ethUtil.stripHexPrefix(address), 'hex')}});
  return data.tokens.map(token=>Token.getJson(token));
}

async function getTransactions(tokenId) {
  const data = await plasma({action: "getTransactionsByTokenId", payload: {tokenId}});
  return data.transactions.map(tx => Transaction.getJson(tx));
}

async function getLastTransaction(tokenId) {
  const data = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});
  return Transaction.getJson(data);
}

module.exports = {
  get,
  getByAddress,
  getTransactions,
  getLastTransaction
};
