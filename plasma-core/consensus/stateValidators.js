import {Candidate, RightsHandler, validatorsQueue} from 'consensus'
import config from 'config'
import rejectCauses from 'child-chain/validator/rejectCauses'

/** asa */
class StateValidators {
  constructor() {
    this.init()
  }

  init() {
    this.candidates = []
    this.stakes = []
    this.votes = 0
  }

  async addCandidate(address) {
    for (let candidate of this.candidates) {
      if (candidate.getAddress() === address) {
        throw new Error(rejectCauses.candidateAlreadyExists)
      }
    }
    this.candidates.push(new Candidate(address))
    this.voteCandidates()
    return {success: true}
  }

  getAllCandidates() {
    return this.candidates
  }

  getCandidate(address) {
    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === address) {
        return this.candidates[i]
      }
    }
    return false
  }

  async voteCandidates() {
    let candidates = [...this.candidates]
    candidates.sort((a, b) => {
      let aWeight = a.getWeight()
      let bWeight = b.getWeight()
      if (aWeight < bWeight) {
        return 1
      }
      if (aWeight > bWeight) {
        return -1
      }
      return 0
    })
    let validators = candidates.splice(0, config.maxDelegates)
    for (let i = 0; i < validators.length; i++) {
      let address = validators[i].getAddress()
      let isValidator =
      await RightsHandler.validateAddressForValidating(address)
      if (!isValidator) {
        await RightsHandler.setValidatorsCandidate(validators[i].getAddress())
      }
    }
    for (let i = 0; i < candidates.length; i++) {
      let address = candidates[i].getAddress()
      let isValidator =
      await RightsHandler.validateAddressForValidating(address)
      if (isValidator) {
        await validatorsQueue.delValidator(address)
      }
    }
    return validators
  }

  clearCandidates() {
    this.candidates = []
    return 'ok'
  }

  async reVote(voter) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        this.votes += 1
        if (this.votes >= 2) {
          await this.voteCandidates()
          this.votes = 0
          return 'Thank you! Recompute candidates is executed'
        }
        return 'Thank you! Need 1 more vote to recompute candidates'
      }
    }
  }

  async removeCandidate(address) {
    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === address) {
        if (RightsHandler.validateAddressForValidating(address)) {
          validatorsQueue.delValidator(address)
        }
        this.candidates.splice(i, 1)
        await this.voteCandidates()
        return {success: true}
      }
    }
    throw new Error(rejectCauses.candidateNotExists)
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
        throw new Error(rejectCauses.nonExistentCandidate)
      }
    }
    throw new Error(rejectCauses.nonExistentStake)
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
            throw new Error(rejectCauses.nonExistentCandidate)
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
    throw new Error(rejectCauses.nonExistentCandidate)
  }
}

const stateValidators = new StateValidators()

stateValidators.init()

export {stateValidators}
