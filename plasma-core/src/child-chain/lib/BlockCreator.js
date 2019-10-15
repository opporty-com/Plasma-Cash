import BN from 'bn.js'
import logger from "./logger";
import config from "../../config";
import web3 from "../../root-chain/web3";
import plasmaContract from "../../root-chain/contracts/plasma";

import validators from "./validators";
import * as Block from "../models/Block";
import * as Transaction from "../models/Transaction";

import {server} from '../lib/PN';


const N = 8;
const PBFT_N = Math.floor((N - 1) / 3);
// const PBFT_F = PBFT_N * 2 + 1;
const PBFT_F = process.env.COUNT_CHECK_PROOF || 0;

class BlockCreator {
  constructor(options = {}) {
    this.options = options || {};
    this.interval();
  }

  async submit() {
    const lastSubmittedBlock = await plasmaContract.getCurrentBlock();
    logger.info(`last submitted block #${lastSubmittedBlock}`);


    const currentValidator = await validators.getCurrent();
    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit');
      return false;
    }


    let count = 0;
    try {
      count = await Transaction.getPoolSize();
    } catch (e) {
      logger.info('Error get pooll size', e);
      return false;
    }
    if (!this.options.minTransactionsInBlock || this.options.minTransactionsInBlock > count) {
      logger.info('Please wait transactions');
      return false;
    }


    if (server.getCountPeers() < PBFT_F) {
      logger.info('Please wait validators');
      return false;
    }

    let newBlockNumber = parseInt(lastSubmittedBlock) + config.contractblockStep;
    logger.info(`Prepare Block submit # ${newBlockNumber}`);


    const limitT = 1000000;
    // const limitT = 350000;
    const transactions = await Transaction.getPool(limitT);
    // logger.info(`transactions`, 2, transactions.length);
    let blockTransactions = [];
    let totalFee = new BN(0);
    const zero = new BN(0);
    for (let tx of transactions) {
      const fee = await Transaction.validate(tx, true);
      if (BN.isBN(fee) && fee.gte(zero)) {
        blockTransactions.push(tx);
        totalFee.add(fee)
      } else
        await Transaction.removeFromPool(tx);
    }
    logger.info(`${blockTransactions.length} transactions in Block #${newBlockNumber}`);
    if (blockTransactions.length === 0) {
      logger.info('Successful transactions is not defined for this block');
      return false;
    }


    const block = {
      number: newBlockNumber,
      countTx: blockTransactions.length,
      transactions: blockTransactions,
      totalFee: totalFee.toString()
    };

    logger.info(`Start sign block #${newBlockNumber}`);

    const signature = await Block.sign(block);


    const blockMerkleRootHash = await Block.getMerkleRootHash(block);
    const blockHash = blockMerkleRootHash.toString('hex');

    logger.info(`End sign block #${newBlockNumber} (${blockHash})`);

    if (Number(PBFT_F)) {
      try {
        await new Promise((resolve, reject) => {
          let commit = 0;


          logger.info(`send block #${newBlockNumber} (${blockHash})`);

          const buffer = Block.getBuffer(block);

          // logger.info(`send block #${newBlockNumber}`, buffer.length);
          server.validateNewBlock(buffer);
          // logger.info(`sent block #${newBlockNumber}`, buffer.length);

          let rejectTimeout = setTimeout(() => {
            logger.info("reject timeout")
            server.removeListener(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
            reject()
          }, config.blockTime*4);


          function getValidateBlock(payload) {
            if (payload.toString('hex') !== blockHash)
              return;

            commit++;
            if (commit < PBFT_F) {
              // logger.info(`wait commit Block`);
              return;
            }

            server.removeListener(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
            clearTimeout(rejectTimeout);
            logger.info(`Block #${newBlockNumber} (${blockHash}) has been validated successful`);
            return resolve();
          }

          server.on(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);

        });
      } catch (e) {
        throw new Error('Successfull transactions is not defined for this block')
      }
    }

    logger.info(`Block  #${newBlockNumber} (${blockHash}) is started submitting to rootchain`);
    await Block.pushToPool(block);


    try {
      await web3.eth.personal.unlockAccount(config.contractOwnerAddress, config.plasmaNodePassword);
      // await web3.eth.personal.unlockAccount(config.plasmaNodeAddress, config.plasmaNodePassword);
    } catch (error) {
      logger.error(`Error submit Block  #${newBlockNumber}, unlock address:`, error.toString());
      throw new Error(`Error submit Block  #${newBlockNumber}, unlock address: ${error.toString()}`);
    }

    let gas = 0;
    try {
      // gas = await plasmaContract.estimateSubmitBlockGas(blockMerkleRootHash, newBlockNumber, config.plasmaNodeAddress);
      gas = await plasmaContract.estimateSubmitBlockGas(blockMerkleRootHash, totalFee.toString(), config.contractOwnerAddress);
    } catch (error) {
      logger.error(`Error submit Block  #${newBlockNumber}, estimate gas:`, error.toString());
      throw new Error(`Error submit Block  #${newBlockNumber}, estimate gas: ${error.toString()}`);
    }

    try {
      // await plasmaContract.submitBlock(blockMerkleRootHash, newBlockNumber, config.plasmaNodeAddress, gas)
      await plasmaContract.submitBlock(blockMerkleRootHash, totalFee.toString(), config.contractOwnerAddress, gas)
    } catch (error) {
      logger.error('Error submit block in contract', error.toString());
      throw new Error(`Error submit block in contract ${error.toString()}`)
    }

    for (let tx of block.transactions) {
      await Transaction.removeFromPool(tx);
    }

    logger.info(`Block  #${newBlockNumber} (${blockHash}) has been submitted successful`);
  }

  async interval() {
    try {
      logger.info(`Start submit Block`);
      await this.submit();
    } catch (e) {
      logger.debug(`Error start submit Block`, e);
    }
    logger.info(`End submit Block`);
    setTimeout(this.interval.bind(this), config.blockPeriod)
  }
}

export default BlockCreator
