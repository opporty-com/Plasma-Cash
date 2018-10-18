import {stateValidators} from 'consensus'

/** Voter */
class Voter {
  constructor(address) {
    this.init(address)
    this.stakes = []
  }

  init(address) {
    this.coins = 10
    this.address = address
  }

  async addStake(value, candidate) {
    if (this.coins < value) {
      return false
    }
    this.coins -= value
    return await stateValidators.addStake({
      voter: this.address, candidate, value,
    })
  }

  wantToVote() {
    return stateValidators.reVote(this.address)
  }

  async toLowerStake(value, candidate) {
    await stateValidators.toLowerStake({
      voter: this.address, candidate, value,
    })
    this.coins += value
  }
}

export {Voter}
