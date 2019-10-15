/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-14
 * moonion.com;
 */

import * as Validator from '../models/Validator';
import config from "../../config";
import logger from "./logger";
import crypto from "crypto";
import plasmaContract from '../../root-chain/contracts/plasma';

class Validators {
  constructor() {
    this.candidates = [];
    this.validators = [];
    this.hungValidators = [];
    this.resetValidators();
    if (process.env.PLASMA_CONTRACT_OWNER_ADDRESS === process.env.PLASMA_NODE_ADDRESS)
      this.checkCandidates();
  }


  async checkCandidates() {

    const validators = await Validator.getValidators();
    const candidates = await Validator.getCandidates();
    let addresses = [];

    for (const candidate of candidates) {
      addresses.push(candidate.address);
      const isValidator = validators.includes(candidate.address);
      let status = null;

      if (candidate.votes >= process.env.CANDIDATE_COUNT_VOTES && !isValidator) {
        status = true;
      } else if (candidate.votes < process.env.CANDIDATE_COUNT_VOTES && isValidator) {
        status = false;
      }

      if (status === null)
        continue;

      try {
        const gas = plasmaContract.estimateSetOperator(candidate.address, status, process.env.PLASMA_NODE_ADDRESS);
        await plasmaContract.setOperator(candidate.address, status, process.env.PLASMA_NODE_ADDRESS, gas);
      } catch (e) {
        logger.error(`Operator ${candidate.address} hasn't been ${status ? "added" : "deleted"}`);
      }

    }

    for (const validator of validators) {
      if (addresses.includes(validator))
        continue;

      try {
        const gas = plasmaContract.estimateSetOperator(validator, false, process.env.PLASMA_NODE_ADDRESS);
        await plasmaContract.setOperator(validator, false, process.env.PLASMA_NODE_ADDRESS, gas);
      } catch (e) {
        logger.error(`Operator ${validator} hasn't been deleted`);
      }

    }


    setTimeout(this.checkCandidates.bind(this), process.env.CANDIDATE_CHECK_TIMEOUT)
  }


  async resetValidators() {
    let validators;
    try {
      validators = await Validator.getValidators()
    } catch (error) {
      return error.toString()
    }
    if (!validators) {
      logger.error('Validators queue initialized with empty queue')
      return false
    }
    this.validators = [...validators];
    await this.prepareValidators();
    return this.getCurrent()

  }

  async prepareValidators() {
    let dateStamp = Date.now()
    let seedData = Math.floor(dateStamp / config.roundInterval);
    this.hungValidators = Object.assign([], this.validators);
    let seedSource = crypto.createHash('sha256')
      .update(String(seedData), 'utf8').digest();
    for (let i = 0, delCount = this.hungValidators.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        let newIndex = seedSource[x] % delCount;
        let b = this.hungValidators[newIndex];
        this.hungValidators[newIndex] = this.hungValidators[i];
        this.hungValidators[i] = b
      }
    }
    return this.hungValidators;
  }

  getCurrent() {
    let dateStamp = Date.now();
    let index = Math.floor((dateStamp / config.blockTime) % (this.hungValidators.length));
    return this.hungValidators[index]
  }

}


const validators = new Validators();

export default validators;
