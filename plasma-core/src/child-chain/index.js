/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import p2pEmitter from "./lib/p2p";
import validators from "./lib/validators";
import logger from "./lib/logger";
import contractHandler from '../root-chain/contracts/plasma';
import web3 from '../root-chain/web3';
import config from '../config';
//import {runSocketServer} from "./client/socketServer"
//import "../api/index.js"


import * as Transaction from './controllers/Transaction';
import * as Block from './controllers/Block';
import * as Token from './controllers/Token';
import ethUtil from "ethereumjs-util";
import TransactionModel from "./models/Transaction";
import {last} from "../api/controllers/Block";


p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.NEW_TX_CREATED, async payload => {
  try {
    await Transaction.add(payload);
  } catch (error) {
    logger.error(error);
  }
});

p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.PREPARE_NEW_BLOCK, async payload => {
  try {
    await Block.validation(payload);
  } catch (error) {
    logger.error(error);
  }
});

p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.NEW_BLOCK_CREATED, async payload => {
  try {
    await Block.add(payload);
  } catch (error) {
    logger.error(error);
  }
});


contractHandler.contract.events.DepositAdded(async (error, event) => {
  if (error)
    return logger.error(error);

  try {
    await Transaction.deposit(event.returnValues);
  } catch (error) {
    logger.error(error);
  }
});

contractHandler.contract.events.BlockSubmitted(async (error, event) => {
  if (error)
    return logger.error(error);

  try {
    await Block.submitted(event.returnValues);
  } catch (error) {
    logger.error(error);
  }

});







class BlockCreator {
  constructor(options = {}) {
    this.options = options || {};
    this.interval();
  }

  async interval() {
    try {
      logger.info(`Start submit Block`);
      await Block.send(this.options.minTransactionsInBlock);
    } catch (e) {
      logger.debug(`Error start submit Block`, e);
    }
    logger.info(`End submit Block`);
    setTimeout(this.interval.bind(this), config.blockPeriod)
  }
}

const blockCreator = new BlockCreator({
  minTransactionsInBlock: 1,
});


//runSocketServer()


validators.addCandidate("0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70");


async function _deposit(address, password) {

  console.log("_deposit", 0);
  const gas = await contractHandler.contract.methods.deposit().estimateGas({from: address});
  console.log("_deposit", 1);
  await web3.eth.personal.unlockAccount(address, password, 1000);
  console.log("_deposit", 2);
  let answer = await contractHandler.contract.methods.deposit()
    .send({from: address, value: 1, gas: gas + 1500000});
  const tokenId = answer.events.DepositAdded.returnValues.tokenId;
 console.log(3, tokenId)
  return tokenId;
}


async function _getToken(token) {
  return await Token.get(token);
}

async function _getTokenOwner(address) {
  return await Token.getByAddress(address);
}

async function _getTokenTransactions(token) {
  return await Token.getTransactions(token);
}

async function _getBlock(number) {
  return await Block.get(number);
}

async function _getLastBlock() {
  return await Block.last();
}

async function _getTransaction(hash) {
  return await Transaction.get(hash);
}

async function _sendTransaction(data) {
  return await Transaction.send(data);
}

async function _getLastTransaction(token) {
  return await Token.getLastTransaction(token);
}


function _sign(hash, pk) {
  let msgHash = ethUtil.hashPersonalMessage(hash);
  let key = Buffer.from(pk, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
}

setTimeout(async () => {
  const address = "0xc124b6565191071e4a5108ee1248f25cfcbe4b24";
  // const address = "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70";
  const newOwner = "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70";
  // const newOwner = "0xc124b6565191071e4a5108ee1248f25cfcbe4b24";
  const pk = "099999f2bc38bfa01d01881738e82fcb00047976617c1228acfa6eb2bfc96de0";
  // const pk = "de3385a80c15c12bc7dd7800f5d383229569269016e6501a2714a3a77885007a";
  const password = "123456";

  let tokenId = "77741040317105814551255922323984835200512019884834605891521679955462605159976";
  const blockNumber = 52;
  const txHash = "c33035a00eccc1e8f0807be5c4c937f8fdea680c49193893fce31b3b4a836162";


  // const block = await _getBlock(blockNumber);
  // console.log(`++++++ Block# ${blockNumber}`, lastBlock);


  const transactionData = {
    prevHash: '0x123',
    prevBlock: -1,
    tokenId,
    type: 'pay',
    newOwner,
  };
  //
  //
  //
  //
  // const tx = await _getTransaction(txHash);
  // console.log(`tx #${txHash}`, tx);
  //
  //
  // const bl = await _getBlock(52);
  // console.log("++++++_getBlock", bl);
  //
  // const lastBlock = await _getLastBlock();
  // console.log("++++++lastBlock", lastBlock);
  //
  // transactionData.prevBlock = lastBlock.number;
  // const lastTx = await _getLastTransaction(tokenId);
  // transactionData.prevHash = lastTx.hash;
  //
  // const txWithoutSignature = new TransactionModel(transactionData);
  //
  // let hash = txWithoutSignature.getHash(true);
  // // console.log("+++++++++txWithoutSignature" ,ethUtil.addHexPrefix(hash.toString('hex')) , txWithoutSignature);
  //
  // transactionData.signature = _sign(hash, pk);
  // console.log("++++++transactionData", transactionData);
  //
  //
  // try {
  //   await _sendTransaction(transactionData);
  // } catch (e) {
  //   console.log("_sendTransaction", e);
  // }

  // tokenId = await _deposit(address, password);
  // console.log("+++++++++++ tokenId", tokenId);

  // setTimeout(async () => {
  //   console.log("++++++++++++ start _getToken", tokenId);
  //   let token;
  //   try {
  //     token = await _getToken(tokenId);
  //   } catch (e) {
  //     console.log("+++++", e)
  //
  //   }
  //   console.log("++++++++++++ token", token);
  //
  //   console.log("++++++ token", token);
  //   const tokens = await _getTokenOwner(address);
  //   console.log("++++++ tokens", tokens);
  //   const transactions = await _getTokenTransactions(tokenId);
  //   console.log("++++++ transactions", transactions);
  //
  // }, 3000);


  // const tokenId = "26908919178170173022464046262047145462435935626854509902240008818656478090534";
  // const token = await _getToken(tokenId);
  // console.log("++++++ token", token);
  // const tokens = await _getTokenOwner(address);
  // console.log("++++++ tokens", tokens);
  // const transactions = await _getTokenTransactions(tokenId);
  // console.log("++++++ transactions", transactions);


}, 1000);


setInterval(async () => {
  const countTx = await Transaction.count();
  const countToken = await Token.count();
  logger.info(`Transactions: ${countTx}; Tokens: ${countToken}`)
}, 5000);
