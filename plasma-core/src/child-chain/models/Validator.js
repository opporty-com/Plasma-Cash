/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-14
 * moonion.com;
 */

import * as ValidatorDb from './db/Validator';


class Validator {
  constructor(address) {
    this.address = address;
    this.stakes = [];
    this.weight = 0;
  }

  addStake({voter, value}) {
    let stakeExists = false;
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        stakeExists = true;
        this.stakes[i].value += value;
        this.weight += value;
      }
    }
    if (!stakeExists) {
      this.stakes.push({voter, value});
      this.weight += value
    }
  }

  toLowerStake({voter, value}) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        if (this.stakes[i].value <= value) {
          this.weight -= this.stakes[i].value;
          this.stakes.splice(i, 1)
        } else {
          this.stakes[i].value -= value;
          this.weight -= value
        }
      }
    }
  }

  getAddress() {
    return this.address
  }

  getWeight() {
    return this.weight
  }

  getJson() {
    return {
      address: this.address,
      weight: this.weight,
    }
  }

  async isValidator() {
    return await ValidatorDb.isValidator(this.getAddress());
  }

  async addToValidator() {
    await ValidatorDb.addToValidator(this.getAddress());
  }

  async deleteFromValidator() {
    await ValidatorDb.deleteFromValidator(this.getAddress());
  }

  static async getAddressValidators() {
    return await ValidatorDb.getValidators();
  }
}


export default Validator;
