import {Candidate, RightsHandler, validatorsQueue} from 'consensus'
import {makeStakeEvent} from 'child-chain'
import config from 'config'

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

  async setCandidate(address) {
    let isCandidate = false

    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === address) {
        isCandidate = true
      }
    }
    if (!isCandidate) {
      this.candidates.push(new Candidate(address))
      this.voteCandidates()
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
    if (config.plasmaNodeAddress != address) {
      return 'you have ability to remove only yourself from validators'
    }
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

  // Lower or delete stake. Checks if stake is available, if there is,
  // then it checks whether there is such a candidate,
  // if there is, the stake is lowered or deleted if it is equal to or
  // greater than the number of existing
  async toLowerStake(stake) {
    let candidateExists = false
    let stakeExists = false
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter &&
        this.stakes[i].candidate === stake.candidate) {
        stakeExists = true
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            const {voter, value} = stake
            this.candidates[i].toLowerStake({
              voter, value,
            })
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
      if (!stakeExists) {
        return 'stake can`t be lowered because it is not exists'
      }
    }
  }

  // first checks if there is a stake with such a voter and a candidate,
  // if there is, then it is checked whether there is such a
  // candidate and the stake increases
  // if there is no such a stake, then it is created
  async addStake(stake) {
    let candidateExists = false
    let stakeExists = false
    let stakeEvent
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter &&
        this.stakes[i].candidate === stake.candidate) {
        stakeExists = true
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            try {
              stakeEvent = await makeStakeEvent(stake)
            } catch (error) {
              return error.toString()
            }
            this.candidates[i].addStake({
              voter: stakeEvent.voter, stake: stakeEvent.value,
            })
            candidateExists = true
          }
        }
        if (candidateExists) {
          this.stakes[i].value += stakeEvent.value
          await this.voteCandidates()
          return this.stakes[i]
        } else {
          return 'Denieded stake on a non-existent candidate'
        }
      }
    }

    if (!stakeExists) {
      for (let i = 0; i < this.candidates.length; i++) {
        if (this.candidates[i].getAddress() === stake.candidate) {
          try {
            stakeEvent = await makeStakeEvent(stake)
          } catch (error) {
            return error.toString()
          }
          this.candidates[i].addStake({
            voter: stakeEvent.voter, value: stakeEvent.value,
          })
          candidateExists = true
        }
      }
      if (candidateExists) {
        this.stakes.push(stakeEvent)
        await this.voteCandidates()
        return stakeEvent
      } else {
        return 'Denieded stake on a non-existent candidate'
      }
    }
  }
}

const stateValidators = new StateValidators()

stateValidators.init()

export {stateValidators}
