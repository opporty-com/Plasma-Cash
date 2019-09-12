/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import ethUtil from 'ethereumjs-util'
import p2pEmitter from "../lib/p2p";
import BlockModel from '../models/Block';
import logger from "../lib/logger";
import plasmaContract from "../../root-chain/contracts/plasma";

async function validation(payload) {
  if (!process.env.IS_VALIDATOR) return;
  logger.info("Validate Block");

  const block = new BlockModel(payload);

  await block.loadTxFromPool();
  logger.info(`Start Validate Block  #${block.get('number')}`);
  const isValid = await block.isValid();
  if (!isValid)
    throw Error(`Not valid Block  #${block.get('number')}`);

  p2pEmitter.sendCommitBlock(block.getRlp(false, false, true));
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
    tx.set('timestamp', new Date().getTime());
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
  if (!block) throw new Error("Block not found!");
  return block.getJson();
}

async function last() {
  const lastSubmittedBlock = await plasmaContract.getCurrentBlock();
  return await get(lastSubmittedBlock);
}

async function getProof({tokenId, blockNumber}) {
  const block = await BlockModel.get(blockNumber);
  if (!block) throw new Error("Block not found!");

  let hash
  try {
    await block.buildMerkle(true)
    hash = block.getProof(tokenId)
  } catch (e) {
    throw Error(e);
  }

  return {hash}
}

async function checkProof({hash, blockNumber, proof}) {
  const block = await BlockModel.get(blockNumber);
  if (!block) throw new Error("Block not found!");

  let result = false;
  try {
    await block.buildMerkle(true);
    result = block.checkProof(proof, hash);
  } catch (e) {
    throw Error(e);
  }
  try {
    const root = block.get('merkleRootHash');
    const res = await plasmaContract.checkProof(hash, root, proof);
    console.log(res)
  } catch (e) {
    console.log(e)
  }
  return {result}
}

export {
  submitted,
  validation,
  add,
  get,
  last,
  getProof,
  checkProof
}
