import logger from "./logger";
import config from "../../config";
import contractHandler from "../../root-chain/contracts/plasma";
import TransactionModel from "../models/Transaction";
import validators from "./validators";
import p2pEmitter from "./p2p";
import BlockModel from "../models/Block";
import {sign} from "../helpers";

const N = 8;
const PBFT_N = Math.floor((N - 1) / 3);
// const PBFT_F = PBFT_N * 2 + 1;
const PBFT_F = 1;

class BlockCreator {
  constructor(options = {}) {
    this.options = options || {};
    this.interval();
  }

  async submit(){

    const lastSubmittedBlock = await contractHandler.contract.methods.getCurrentBlock().call();
    logger.info(`last submitted block #${lastSubmittedBlock}`);

    const count = await TransactionModel.getPoolSize();
    if (!this.options.minTransactionsInBlock || this.options.minTransactionsInBlock > count) {
      logger.info('Please wait transactions');
      throw new Error('Please wait transactions')
    }

    const currentValidator = await validators.getCurrent();

    if (!(currentValidator === config.plasmaNodeAddress)) {
      logger.info('Please wait your turn to submit');
      throw new Error('Please wait your turn to submit')
    }

    if (p2pEmitter.getCountPeers() <= PBFT_F) {
      logger.info('Please wait validators');
      throw new Error('Please wait validators')
    }

    // const lastBlockNumber = await BlockModel.getLastNumber();
    // let newBlockNumber = lastBlockNumber + config.contractblockStep;
    let newBlockNumber = parseInt(lastSubmittedBlock) + config.contractblockStep;
    logger.info(`Prepare Block submit # ${newBlockNumber}`);

    logger.info(`transactions`, 1);
    const transactions = await TransactionModel.getPool(false, 100000);
    logger.info(`transactions`, 2, transactions.length);
    let blockTransactions = [];
    for (let tx of transactions) {
      const isValid = await tx.isValid();
      if (isValid) {
        blockTransactions.push(tx);
      }
      else
        await tx.removeFromPool();
    }
    logger.info(`transactions`, 3, blockTransactions.length);
    if (blockTransactions.length === 0) {
      logger.info('Successfull transactions is not defined for this block');
      throw new Error('Successfull transactions is not defined for this block')
      //return false;
    }



    const block = new BlockModel({
      number: newBlockNumber,
      transactions: blockTransactions,
      signer: config.plasmaNodeAddress
    });
    logger.info(`sign block #${newBlockNumber}`, 0);
    await block.buildMerkle();
    logger.info(`sign block #${newBlockNumber}`, 1, block.get('merkleRootHash'));
    let blockDataToSig = block.getRlp(true, true);
    logger.info(`sign block #${newBlockNumber}`, 2, blockDataToSig);
    const signature = sign(blockDataToSig);
    logger.info(`sign block #${newBlockNumber}`, 3, signature);
    block.set('signature', signature);
    logger.info(`sign block #${newBlockNumber}`, 4);
    try {
      await new Promise((resolve, reject) => {
        let commit = 0;

        let rejectTimeout = setTimeout(() => {
          logger.info("reject timeout")
          p2pEmitter.removeListener(p2pEmitter.EVENT_MESSAGES.NEW_BLOCK_COMMIT, getValidateBlock);
          reject()
        }, config.blockPeriod);

        logger.info(`send block #${newBlockNumber}`);
        let rplData;
        rplData = block.getRlp(false, true);

        p2pEmitter.validateNewBlock(rplData);
        logger.info(`sent block #${newBlockNumber}`, rplData.length);

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


    const blockMerkleRootHash = block.get('merkleRootHash');
    logger.info('Block submit #', newBlockNumber, blockMerkleRootHash);

    p2pEmitter.sendNewBlock(block.getRlp(false, true));
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

  async interval() {
    try {
      logger.info(`Start submit Block`);
      await this.submit();
    } catch (e) {
      // logger.debug(`Error start submit Block`, e);
    }
    logger.info(`End submit Block`);
    setTimeout(this.interval.bind(this), config.blockPeriod)
  }
}

export default BlockCreator
