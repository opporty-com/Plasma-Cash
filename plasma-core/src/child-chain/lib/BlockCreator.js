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

    const currentValidator = await validators.getCurrent();
    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit');
      return false;
    }
    if (server.getCountPeers() < PBFT_F) {
      logger.info('Please wait validators');
      return false;
    }

    let newBlockNumber = parseInt(lastSubmittedBlock) + config.contractblockStep;
    logger.info(`Prepare Block submit # ${newBlockNumber}`);


    const limitT = 1000000;
    // const limitT = 1;
    logger.info(`transactions limitT`, 1, limitT);
    const transactions = await Transaction.getPool(limitT);
    logger.info(`transactions`, 2, transactions.length);
    let blockTransactions = [];
    for (let tx of transactions) {
      const isValid = await Transaction.validate(tx);
      if (isValid) {
        blockTransactions.push(tx);
      } else
        await Transaction.removeFromPool(tx);
    }
    logger.info(`transactions`, 3, blockTransactions.length);
    if (blockTransactions.length === 0) {
      logger.info('Successful transactions is not defined for this block');
      return false;
    }


    const block = {
      number: newBlockNumber,
      countTx: blockTransactions.length,
      transactions: blockTransactions,
    };

    logger.info(`sign block #${newBlockNumber}`, 0);


      const signature = await Block.sign(block);
    logger.info(`sign block #${newBlockNumber}`, 1);


    if (Number(PBFT_F)) {
      try {
        await new Promise((resolve, reject) => {
          let commit = 0;


          logger.info(`send block #${newBlockNumber}`);

          const buffer = Block.getBuffer(block);

          logger.info(`send block #${newBlockNumber}`, buffer.length);
          server.validateNewBlock(buffer);
          logger.info(`sent block #${newBlockNumber}`, buffer.length);

          let rejectTimeout = setTimeout(() => {
            logger.info("reject timeout")
            server.removeListener(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
            reject()
          }, config.blockPeriod);


          function getValidateBlock(payload) {
            commit++;
            if (commit < PBFT_F) {
              logger.info(`wait commit Block`);
              return;
            }

            server.removeListener(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
            clearTimeout(rejectTimeout);
            logger.info(`Block #${newBlockNumber} has been validated successful`);
            return resolve();
          }

          server.on(server.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);

        });
      } catch (e) {
        throw new Error('Successfull transactions is not defined for this block')
      }
    }


    await Block.pushToPool(block);

    const blockMerkleRootHash = await Block.getMerkleRootHash(block);

    try {
      await web3.eth.personal.unlockAccount(config.plasmaNodeAddress, config.plasmaNodePassword);
    } catch (error) {
      logger.error(`Error submit Block  #${newBlockNumber}, unlock address:`, error.toString());
      throw new Error(`Error submit Block  #${newBlockNumber}, unlock address: ${error.toString()}`);
    }

    let gas = 0;
    try {
      gas = await plasmaContract.estimateSubmitBlockGas(blockMerkleRootHash, newBlockNumber, config.plasmaNodeAddress);
    } catch (error) {
      logger.error(`Error submit Block  #${newBlockNumber}, estimate gas:`, error.toString());
      throw new Error(`Error submit Block  #${newBlockNumber}, estimate gas: ${error.toString()}`);
    }

    try {
      await plasmaContract.submitBlock(blockMerkleRootHash, newBlockNumber, config.plasmaNodeAddress, gas)
    } catch (error) {
      logger.error('Error submit block in contract', error.toString());
      throw new Error(`Error submit block in contract ${error.toString()}`)
    }

    for (let tx of block.transactions) {
      await Transaction.removeFromPool(tx);
    }

    logger.info(`Block  #${newBlockNumber} has been submitted successful`);
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
