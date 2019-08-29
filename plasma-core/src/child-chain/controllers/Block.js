/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import ethUtil from 'ethereumjs-util'
import p2pEmitter from "../lib/p2p";
import TransactionModel from '../models/Transaction';
import BlockModel from '../models/Block';

import logger from "../lib/logger";
import config from "../../config";

import validators from '../lib/validators';
import contractHandler from "../../root-chain/contracts/plasma";

const N = 8;
const PBFT_N = Math.floor((N - 1) / 3);
// const PBFT_F = PBFT_N * 2 + 1;
const PBFT_F = 1;

async function send(minTransactionsInBlock) {
  const count = await TransactionModel.getPoolSize();
  if (!minTransactionsInBlock || minTransactionsInBlock > count) {
    logger.info('Please wait transactions');
    //return false
    throw new Error('Please wait transactions')
    //return false;
  }

  const currentValidator = await validators.getCurrent();

  if (!(currentValidator === config.plasmaNodeAddress)) {
    logger.info('Please wait your turn to submit');
    throw new Error('Please wait your turn to submit')
    //return false
  }

  const transactions = await TransactionModel.getPool();
  let blockTransactions = [];
  for (let tx of transactions) {
    const isValid = await tx.isValid();
    if (isValid)
      blockTransactions.push(tx);
    else
      await tx.removeFromPool();
  }

  if (blockTransactions.length === 0) {
    logger.info('Successfull transactions is not defined for this block');
    throw new Error('Successfull transactions is not defined for this block')
    //return false;
  }

  const lastSubmittedBlock = await contractHandler.contract.methods.getCurrentBlock().call();

  // const lastBlockNumber = await BlockModel.getLastNumber();
  // let newBlockNumber = lastBlockNumber + config.contractblockStep;
  let newBlockNumber = parseInt(lastSubmittedBlock) + config.contractblockStep;
  logger.info(`Prepare Block submit # ${newBlockNumber}`);
  let block = new BlockModel({
    number: newBlockNumber,
    transactions: blockTransactions,
    signer: config.plasmaNodeAddress
  });
  let blockDataToSig = block.getRlp(true);
  let blockHash = ethUtil.hashPersonalMessage(blockDataToSig);
  let key = Buffer.from(config.plasmaNodeKey, 'hex');
  block.signature = ethUtil.ecsign(blockHash, key);
  try {
    await new Promise((resolve, reject) => {
      let commit = 0;

      let rejectTimeout = setTimeout(() => {
        console.log("reject timeout")
        reject()
      }, config.blockPeriod);

      p2pEmitter.validateNewBlock(block.getRlp());

      function getValidateBlock(payload) {
        commit++;
        if (commit <= PBFT_F) {
          logger.info(`wait commit Block`);
          return;
        }

        p2pEmitter.removeListener(p2pEmitter.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
        clearTimeout(rejectTimeout);
        logger.info(`Block #${newBlockNumber} has been validated successful`);
        return resolve();
      }

      p2pEmitter.on(p2pEmitter.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);

    });
  } catch (e) {
    throw new Error('Successfull transactions is not defined for this block')
  }


  const blockMerkleRootHash = block.getMerkleRootHash();
  logger.info('Block submit #', newBlockNumber, blockMerkleRootHash);

  p2pEmitter.sendNewBlock(block.getRlp());
  logger.info(`Block #${newBlockNumber} has been send`);
  await block.save();
  let gas = 0;
  try {
    gas = await contractHandler.contract.methods
      .submitBlock(blockMerkleRootHash, newBlockNumber)
      .estimateGas({from: config.plasmaNodeAddress});

  } catch (error) {
    logger.error(`Error submit Block  #${newBlockNumber}, estimate gas:`, error.toString());
    throw new Error(`Error submit Block  #${newBlockNumber}, estimate gas: ${error.toString()}`);
  }
  try {
    await contractHandler.contract.methods
      .submitBlock(blockMerkleRootHash, newBlockNumber)
      .send({from: config.plasmaNodeAddress, gas: parseInt(gas) + 15000});

  } catch (error) {
    logger.error('Error submit block in contract', error.toString());
    throw new Error('Successful transactions is not defined for this block')
  }

  logger.info(`Block  #${newBlockNumber} has been submitted successful`);
}

async function validation(payload) {
  let block = new BlockModel(payload);
  logger.info(`Start Validate Block  #${block.number}`);
  const isValid = await block.isValid();
  if (!isValid)
    throw Error(`Not valid Block  #${block.number}`);

  p2pEmitter.sendCommitBlock(block.getRlp());
  logger.info(`validation block # ${block.number}`);
}

async function add(payload) {
  let block = new BlockModel(payload);
  logger.info(`Start Add Block  #${block.number}`);
  await block.add();
}

async function submitted({operator, merkleRoot, blockNumber}) {
  logger.info('Block submitted #', blockNumber, merkleRoot, operator);

  const block = await BlockModel.get(blockNumber);
  if (!block)
    throw Error(`Not found Block  #${blockNumber}`);


  if (ethUtil.addHexPrefix(merkleRoot).toLowerCase() !== ethUtil.addHexPrefix(block.getMerkleRootHash()).toLowerCase() || ethUtil.addHexPrefix(operator).toLowerCase() !== ethUtil.addHexPrefix(block.signer).toLowerCase())
    throw Error(`Block is huk  #${blockNumber}`);


  const transactions = block.getTx();
  for (let tx of transactions) {
    await tx.execute();
  }

  logger.info(`Block added #${blockNumber}; ${transactions.length} transactions execute `);
}

async function get(number) {
  const block = await BlockModel.get(number);
  if (!block) throw new Error("Block not found!")
  return block.getJson();
}

async function last() {
  const lastBlock = await BlockModel.getLastNumber();
  return await get(lastBlock);
}

export {
  send,
  submitted,
  validation,
  add,
  get,
  last
}
