/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */
import * as ethUtil from 'ethereumjs-util';
import plasmaContract from "../../root-chain/contracts/plasma";
import logger from "../lib/logger";
import {client} from "../lib/PN";

import * as Block from '../models/Block';
import * as Transaction from '../models/Transaction';


async function validation(payload) {
  if (!process.env.IS_VALIDATOR) return;
  // logger.info("Validate Block", payload.length);

  const block = Block.fromBuffer(payload);

  const blockMerkleRootHash = await Block.getMerkleRootHash(block);
  const blockHash = blockMerkleRootHash.toString('hex');
  // logger.info(`Start Validate Block  #${block.number}`);

  const isValid = await Block.validate(block);
  if (!isValid)
    throw Error(`Not valid Block  #${block.number} (${blockHash})`);

  logger.info(`Block # ${block.number} (${blockHash}) is valid`);

  await Block.pushToPool(block);

  // logger.info(`block # ${block.number} added to pool`);

  client.sendCommitBlock(blockMerkleRootHash);

  // logger.info(`block # ${block.number} commit`);
}

async function submitted({operator, merkleRoot, blockNumber}) {
  logger.info('Block submitted #', blockNumber, merkleRoot, operator);

  let block = await Block.getPool(merkleRoot.toLowerCase());
  if (!block)
    throw Error(`Not found Block  #${blockNumber}`);

  block.number = parseInt(blockNumber);

  // const signer = await Block.getSigner(block);
  // if (ethUtil.addHexPrefix(operator).toLowerCase() !== ethUtil.addHexPrefix(signer).toLowerCase()
  //   || block.number !== parseInt(blockNumber))
  //   throw Error(`Block is huk  #${blockNumber}`);


  logger.info(`Block added #${blockNumber}; Start execute ${block.transactions.length} transactions `);
  let i = -1;
  const now = (new Date()).getTime();

  async function execute() {
    i++;
    if (i >= block.transactions.length) return;
    const tx = block.transactions[i];
    tx.blockNumber = block.number;
    tx.timestamp = now;
    await Transaction.execute(tx);
    await execute();
  }

  await Promise.all((Array(Math.min(10000, block.transactions.length))).fill(0).map(async i => await execute()));


  await Block.save(block, true);
  await Block.removeFromPool(block);

  logger.info(`Block added #${blockNumber}; ${block.transactions.length} transactions execute `);
}

async function get(number) {
  const block = await Block.get(number);
  if (!block) throw new Error("Block not found!");
  return Block.getJson(block);
}

async function last() {
  const lastSubmittedBlock = await plasmaContract.getCurrentBlock();
  return await get(lastSubmittedBlock);
}

async function getProof({tokenId, blockNumber}) {
  const block = await Block.get(blockNumber);
  if (!block) throw new Error("Block not found!");

  let hash;
  try {
    hash = Block.getProof(block, tokenId)
  } catch (e) {
    throw Error(e);
  }

  return {hash}
}

async function checkProof({hash, blockNumber, proof}) {
  const block = await Block.get(blockNumber);
  if (!block) throw new Error("Block not found!");

  let result = false;
  try {
    result = Block.checkProof(block, proof, hash);
  } catch (e) {
    throw Error(e);
  }
  try {
    const root = await Block.getMerkleRootHash(block);
    const res = await plasmaContract.checkProof(ethUtil.addHexPrefix(hash), root, ethUtil.addHexPrefix(proof));
    console.log(res)
  } catch (e) {
    console.log(e)
  }
  return {result}
}

export {
  submitted,
  validation,
  get,
  last,
  getProof,
  checkProof
}
