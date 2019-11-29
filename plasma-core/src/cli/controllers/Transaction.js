import * as ethUtil from 'ethereumjs-util';
import { promise as plasma } from "../lib/plasma-client";
import * as Transaction from "../helpers/Transaction";
import BN from "bn.js";
import * as RLP from "rlp";
import web3 from '../../root-chain/web3';

async function send(address, password, tokenId, type) {
  type = parseInt(type);
  if (!type || isNaN(type)) {
    console.log('Type option must contain valid number.');
    process.exit(1);
  }
  const token = await plasma({action: "getToken", payload: {tokenId}});
  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});

  const fee = 1;
  const data = {
    prevHash: lastTx.hash,
    prevBlock: lastTx.blockNumber,
    tokenId,
    type,
    totalFee: (parseInt(lastTx.totalFee) + fee).toString(),
    fee: fee.toString(),
    newOwner: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),
    dataLength: 0,
    data: Buffer.from(''),
    blockNumber: 0,
    timestamp: (new Date()).getTime()
  };

  let dataToEncode = [
    data.prevHash,
    data.prevBlock,
    new BN(data.tokenId),
    data.newOwner,
    data.type,
    new BN(data.totalFee),
    new BN(data.fee),
    data.data,
  ];

  const hash = ethUtil.keccak(RLP.encode(dataToEncode));
  data.signature = ethUtil.toBuffer(await web3.eth.personal.sign(ethUtil.addHexPrefix(hash.toString('hex')), ethUtil.addHexPrefix(token.owner.toString('hex')), password));

  dataToEncode.push(data.signature);
  data.hash = ethUtil.keccak(RLP.encode(dataToEncode));
  return await plasma({action: "sendTransaction", payload: data});
}

async function getPool() {
  const data = await plasma({action: "getPool", payload: {}});
  return data.transactions.map(tx => Transaction.getJson(tx));
}

async function get(hash) {
  const data = await plasma({action: "getTransactionByHash", payload: {hash: Buffer.from(ethUtil.stripHexPrefix(hash), 'hex')}});
  return Transaction.getJson(data);
}

async function getTransactionsByAddress(address) {
  const data = await plasma({ action: "getTransactionsByAddress", payload: {address}});
  return data.transactions.map(tx => Transaction.getJson(tx));
}

module.exports =  {
  send,
  getPool,
  get,
  getTransactionsByAddress
};
