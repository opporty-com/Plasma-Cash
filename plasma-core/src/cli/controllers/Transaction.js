import * as ethUtil from 'ethereumjs-util';
import {client, promise as plasma} from "../lib/plasma-client";
import * as Transaction from "../helpers/Transaction";
import BN from "bn.js";
import * as RLP from "rlp";
import web3 from '../../root-chain/web3';

const MAX_COUNTER = 50;
const INTERVAL = 5000;


async function send(address, tokenId, type, wait, credentials) {
  type = parseInt(type);
  if (!type || isNaN(type)) {
    console.log('Type option must contain valid number.');
    process.exit(1);
  }
  const token = await plasma({action: "getToken", payload: {tokenId}});
  if (ethUtil.addHexPrefix(token.owner.toString('hex').toLowerCase()) !== ethUtil.addHexPrefix(credentials.address.toLowerCase())) {
    console.log('You are not an owner of token. Operation cancelled.');
    process.exit(1);
  }
  console.log('1. Token has been found.');

  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});
  console.log('2. Got last transaction by token ID.');

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
  data.signature = ethUtil.toBuffer(await web3.eth.personal.sign(ethUtil.addHexPrefix(hash.toString('hex')), ethUtil.addHexPrefix(credentials.address.toString('hex')), credentials.password));

  dataToEncode.push(data.signature);
  data.hash = ethUtil.keccak(RLP.encode(dataToEncode));
  console.log('3. Sending new transaction...');

  if (wait) {
    const newTx = await plasma({action: "sendTransaction", payload: data});
    console.log(`4. Trying to get same transaction from plasma (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);

    client();
    let result;
    await new Promise(resolve => {
      let counter = 0;
      const interval = setInterval(async () => {
        counter++;
        let logStr = `Attempt number ${counter}, time left: ~${counter*5}s. `;
        const data = await plasma({action: "getTransactionByHash", payload: {hash: newTx.hash}})
          .catch(e => {
            logStr += `Answered with error: ${e}. `;
            return null;
          });

        if (data) {
          result = Transaction.getJson(data);
          logStr += `Result: Transaction has been found! Data:`;
        } else logStr += 'Result: No data received...';
        console.log(logStr);

        if ((result && result.hash) || counter === MAX_COUNTER) {
          clearInterval(interval);
          resolve(true);
        }
      }, INTERVAL);
    });
    if (!(result && result.hash))
      return `Transaction (hash: ${newTx.hash}) was not found in plasma network!`;
    return result;
  }
  return Transaction.getJson(await plasma({action: "sendTransaction", payload: data}));
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
