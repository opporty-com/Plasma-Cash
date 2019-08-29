/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-14
 * moonion.com;
 */

import ValidatorModel from '../models/Validator';
import config from "../../config";
import logger from "./logger";
import crypto from "crypto";

class Validators {
  constructor() {
    this.candidates = [];
    this.validators = [];
    this.hungValidators = [];
    this.stakes = [];
    this.votes = 0;
    this.resetValidators();
  }


  async resetValidators() {
    let validators;
    try {
      validators = await ValidatorModel.getAddressValidators()
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
      .update(String(seedData), 'utf8').digest()
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

  async addCandidate(address) {
    for (let candidate of this.candidates) {
      if (candidate.getAddress() === address) {
        throw new Error("Candidate exist")
      }
    }
    this.candidates.push(new ValidatorModel(address));
    await this.voteCandidates();
    return true
  }

  async voteCandidates() {
    let candidates = [...this.candidates];
    candidates.sort((a, b) => {
      let aWeight = a.getWeight();
      let bWeight = b.getWeight();
      if (aWeight < bWeight) {
        return 1
      }
      if (aWeight > bWeight) {
        return -1
      }
      return 0
    });
    let validators = candidates.splice(0, config.maxDelegates);

    for (let i = 0; i < validators.length; i++) {
      const isValidator = await validators[i].isValidator();
      if (isValidator) continue;
      await validators[i].addToValidator();
      this.validators.push(validators[i].getAddress());
    }

    for (let i = 0; i < candidates.length; i++) {
      if (!(await candidates[i].isValidator)) continue;
      await candidates[i].deleteFromValidator();
      this.validators.splice(this.validators.indexOf(candidates[i].getAddress()), 1);
    }
    await this.prepareValidators();
    return validators
  }


  // Lower or delete stake. Checks if stake is available, if there is,
  // then it checks whether there is such a candidate,
  // if there is, the stake is lowered or deleted if it is equal to or
  // greater than the number of existing
  async toLowerStake(stake) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter &&
        this.stakes[i].candidate === stake.candidate) {
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            const {voter, value} = stake
            this.candidates[i].toLowerStake({
              voter, value,
            })
            if (this.stakes[i].value <= stake.value) {
              this.stakes.splice(i, 1)
              await this.voteCandidates()
              return {success: true}
            } else {
              this.stakes[i].value -= stake.value
              await this.voteCandidates()
              return {success: true}
            }
          }
        }
      } else {
        throw new Error("Denieded stake on a non-existent candidate")
      }
    }
    throw new Error("Stake can`t be lowered because it is not exists")
  }

  // first checks if there is a stake with such a voter and a candidate,
  // if there is, then it is checked whether there is such a
  // candidate and the stake increases
  // if there is no such a stake, then it is created
  async addStake(stake) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter &&
        this.stakes[i].candidate === stake.candidate) {
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            this.candidates[i].addStake({
              voter: stake.voter, value: stake.value,
            })
            this.stakes[i].value += stake.value
            await this.voteCandidates()
            return {success: true}
          } else {
            throw new Error("Denieded stake on a non-existent candidate")
          }
        }
      }
    }
    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === stake.candidate) {
        this.candidates[i].addStake({
          voter: stake.voter, value: stake.value,
        })
        this.stakes.push(stake)
        await this.voteCandidates()
        return {success: true}
      }
    }
    throw new Error("Denieded stake on a non-existent candidate")
  }

  getCurrent() {
    let dateStamp = Date.now();
    let index = Math.floor((dateStamp / config.blockTime) % (this.hungValidators.length));
    return this.hungValidators[index]
  }

  getCandidates(){
    return this.candidates;
  }
  getValidators(){
    return this.validators;
  }
}


const validators = new Validators();

export default validators;
