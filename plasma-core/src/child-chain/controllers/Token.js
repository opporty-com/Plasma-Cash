/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import * as Token from '../models/Token';
import * as Transaction from '../models/Transaction';

async function get(tokenId) {
  if (!tokenId) throw new Error("Token not found");
  const token = await Token.get(tokenId);
  if (!token) throw new Error("Token not found");
  return token;
}

async function getByAddress(address) {
  return await Token.getByOwner(address);
}

async function getTransactions(tokenId) {
  return await Transaction.getByToken(tokenId);
}

async function getLastTransaction(tokenId) {
  const tx = await Transaction.getLastByToken(tokenId);
  if (!tx) throw new Error("Transaction not found");
  return tx;
}

async function count() {
  return await Token.count();
}

// emit ExitAdded(msg.sender, record.priority, token_id);
//  event ExitAdded(address exitor, uint priority, uint exitId);
async function startExit({exitor, priority, exitId}) {
  const token = await Token.get(exitId);
  if (!token) throw new Error("Token not found");
  token.status = Token.STATUSES.IN_EXIT;
  await Token.save(token);
  return Token.getJson(token);
}

//  emit ExitCompleteEvent(current_blk, record.block_num, record.token_id, tokens[record.token_id]);
//  event ExitCompleteEvent(uint blockNumber, uint exitBlockNumber, uint exitTokenId, uint exitDenom);
async function endExit({blockNumber, exitBlockNumber, exitTokenId, exitDenom}) {
  const token = await Token.get(exitTokenId);
  if (!token) throw new Error("Token not found");
  token.status = Token.STATUSES.EXIT;
  await Token.save(token);
  return Token.getJson(token);
}


export {
  get,
  getByAddress,
  getTransactions,
  getLastTransaction,
  count,
  startExit,
  endExit
}
