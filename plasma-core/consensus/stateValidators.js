import { Candidate, RightsHandler, validatorsQueue } from 'consensus'

class StateValidators {

  constructor() {
    this.init()
  }

  init() {
    this.candidates = []
    this.stakes = []
    this.votes = 0
  }

  async setCandidate(address) {
    let isCandidate = false

    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === address) {
        isCandidate = true
      }
    }
    if (!isCandidate) {
      this.candidates.push(new Candidate(address))
      return 'ok'
    } else {
      return 'already exist'
    }
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

    let candidates = this.candidates.slice(0)

    candidates.sort((a, b) => {
      let aWeight = a.getWeight(), bWeight = b.getWeight()
      if (aWeight < bWeight)
        return 1
      if (aWeight > bWeight)
        return -1;
      return 0;
    })

    let ValidatorsCount = 3
    let validators = candidates.splice(0, ValidatorsCount)

    for (let i = 0; i < validators.length; i++) {
      let address = validators[i].getAddress()
      let isValidator = await RightsHandler.validateAddressForValidating(address)
      if (!isValidator) {
        await RightsHandler.setValidatorsCandidate(validators[i].getAddress())
      }
    }

    for (let i = 0; i < candidates.length; i++) {
      let address = candidates[i].getAddress()
      let isValidator = await RightsHandler.validateAddressForValidating(address)
      if (isValidator) {
        validatorsQueue.delValidator(address)
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
        return 'ok'
      }
    }
    return 'this candidate is not include to list of candidates'
  }

  // Lower or delete stake. Checks if stake is available, if there is, then it checks whether there is such a candidate,
  // if there is, the stake is lowered or deleted if it is equal to or greater than the number of existing
  async toLowerStake(stake) {
    let candidateExists = false

    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter && this.stakes[i].candidate === stake.candidate) {
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            this.candidates[i].toLowerStake({ voter: stake.voter, value: stake.value })
            candidateExists = true
          }
        }
        if (candidateExists) {
          if (this.stakes[i].value <= stake.value) {
            this.stakes.splice(i, 1)
            await this.voteCandidates()
            return 'ok'
          } else {
            this.stakes[i].value -= stake.value
            await this.voteCandidates()
            return 'ok'
          }
        } else {
          throw new Error('Denieded stake on a non-existent candidate')
        }
      }
    }
  }

  // first checks if there is a stake with such a voter and a candidate,
  // if there is, then it is checked whether there is such a candidate and the stake increases
  // if there is no such a stake, then it is created
  async addStake(stake) {

    let candidateExists = false,
      stakeExists = false

    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter && this.stakes[i].candidate === stake.candidate) {
        stakeExists = true
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            this.candidates[i].addStake({ voter: stake.voter, value: stake.value })
            candidateExists = true
          }
        }
        if (candidateExists) {
          this.stakes[i].value += stake.value
          await this.voteCandidates()
          return this.stakes[i]
        } else {
          throw new Error('Denieded stake on a non-existent candidate')
        }
      }
    }

    if (!stakeExists) {
      for (let i = 0; i < this.candidates.length; i++) {
        if (this.candidates[i].getAddress() === stake.candidate) {
          this.candidates[i].addStake({ voter: stake.voter, value: stake.value })
          candidateExists = true
        }
      }
      if (candidateExists) {
        this.stakes.push(stake)
        await this.voteCandidates()
        return stake
      }
      else {
        throw new Error('Denieded stake on a non-existent candidate')
      }
    }
  }
}

const stateValidators = new StateValidators()

stateValidators.init()

export { stateValidators }
