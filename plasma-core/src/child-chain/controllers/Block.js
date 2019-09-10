/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import ethUtil from 'ethereumjs-util'
import p2pEmitter from "../lib/p2p";
import BlockModel from '../models/Block';
import logger from "../lib/logger";
import contractHandler from "../../root-chain/contracts/plasma";

async function validation(payload) {
  if (!process.env.IS_VALIDATOR) return;
  logger.info("Validate Block", payload.length, payload);

  const block = new BlockModel(payload);

  // await block.loadTxFromPool();
  logger.info(`Start Validate Block  #${block.get('number')}`);
  const isValid = await block.isValid();
  if (!isValid)
    throw Error(`Not valid Block  #${block.get('number')}`);

  // p2pEmitter.sendCommitBlock(block.getRlp(false, false, true));
  logger.info(`validation block # ${block.number}`);
}

async function add(payload) {
  let block = new BlockModel(payload);
  await block.loadTxFromPool();
  logger.info(`Start Add Block  #${block.number}`);
  await block.add();
}

async function submitted({operator, merkleRoot, blockNumber}) {
  logger.info('Block submitted #', blockNumber, merkleRoot, operator);

  const block = await BlockModel.get(blockNumber);
  if (!block)
    throw Error(`Not found Block  #${blockNumber}`);


  if (ethUtil.addHexPrefix(merkleRoot).toLowerCase() !== ethUtil.addHexPrefix(block.get('merkleRootHash')).toLowerCase() || ethUtil.addHexPrefix(operator).toLowerCase() !== ethUtil.addHexPrefix(block.get('signer')).toLowerCase())
    throw Error(`Block is huk  #${blockNumber}`);

  const promises = [];
  for (let tx of block.transactions) {
    tx.set('blockNumber', parseInt(blockNumber));
    promises.push(new Promise(async resolve => {
      await tx.execute();
      resolve();
    }))
  }
  await Promise.all(promises);

  logger.info(`Block added #${blockNumber}; ${block.transactions.length} transactions execute `);
}

async function get(number) {
  const block = await BlockModel.get(number);
  if (!block) throw new Error("Block not found!")
  return block.getJson();
}

async function last() {
  const lastSubmittedBlock = await contractHandler.contract.methods.getCurrentBlock().call();
  return await get(lastSubmittedBlock);
}

export {
  submitted,
  validation,
  add,
  get,
  last
}
