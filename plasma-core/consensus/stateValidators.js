import {Candidate, RightsHandler, validatorsQueue} from 'consensus'
import {makeAddStakeEvent, makeLowerStakeEvent} from 'child-chain/eventsHandler'
import contractHandler from 'root-chain/contracts/plasma'
import config from 'config'

/** asa */
class StateValidators {
  constructor() {
    this.init()
  }

  async init() {
    this.candidates = []
    this.stakes = []
    this.mainStakes = []
    await this.voteCandidates()
  }

  getAllCandidates() {
    return this.mainStakes
  }

  async setCandidate() {
    let gas = await contractHandler.contract.methods.addCandidate()
      .estimateGas({from: config.plasmaNodeAddress})
    await contractHandler.contract.methods.addCandidate()
      .send({from: config.plasmaNodeAddress, gas: gas + 15000})
    this.voteCandidates()
    return 'ok'
  }

  async removeCandidate() {
    let gas = await contractHandler.contract.methods.removeCandidate()
      .estimateGas({from: config.plasmaNodeAddress})
    await contractHandler.contract.methods.removeCandidate()
      .send({from: config.plasmaNodeAddress, gas: gas + 15000})
    this.voteCandidates()
    return 'ok'
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
    let candidatiesAddresses = await contractHandler.contract.methods
      .getCandidaties().call({from: config.plasmaNodeAddress})
    this.mainStakes = []
    for (let i = 0; i<candidatiesAddresses.length; i++) {
      this.mainStakes.push({
        address: `${candidatiesAddresses[i]}`,
        weight: (await contractHandler.contract.methods
          .getStakes(candidatiesAddresses[i])
          .call({from: config.plasmaNodeAddress})).length})
    }

    let candidates = Object.assign([], this.mainStakes)
    candidates.sort((a, b) => {
      let aWeight = a.weight
      let bWeight = b.weight
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
      // let address = validators[i].getAddress()
      let isValidator =
      await RightsHandler.validateAddressForValidating(validators[i].address)
      if (!isValidator) {
        await RightsHandler.setValidatorsCandidate(validators[i].address)
      }
    }
    for (let i = 0; i < candidates.length; i++) {
      let isValidator =
      await RightsHandler.validateAddressForValidating(candidates[i].address)
      if (isValidator) {
        await validatorsQueue.delValidator(candidates[i].address)
      }
    }
    return validators
  }

  async addStake({voter, candidate, tokenIds}) {
    try {
      // if (!(await redis.hgetAsync(`utxo_${voter}`, tokenId))) {
      //   throw new Error('Forbidden token')
      // }
      // if (await redis.hgetAsync('frozen', tokenId)) {
      //   throw new Error('This token is already frozen')
      // }
      let gas = await contractHandler.contract.methods
        .addStake(candidate, tokenIds)
        .estimateGas({from: voter})
      let answer = await contractHandler.contract.methods
        .addStake(candidate, tokenIds)
        .send({from: voter, gas: gas + 15000})
      let returnValues = answer.events.StakeAdded.returnValues
      // await redis.hsetAsync('frozen', tokenId, voter)
      let stake = {
        voter: returnValues.voter,
        candidate: returnValues.candidate,
        value: +returnValues.value,
      }
      this.voteCandidates()
      return stake
    } catch (error) {
      return error.toString()
    }
  }

  async toLowerStake({voter, candidate, tokenIds}) {
    try {
      // if (!(await redis.hgetAsync(`utxo_${voter}`, tokenId))) {
      //   throw new Error('Forbidden token')
      // }
      let gas = await contractHandler.contract.methods
        .lowerStake(candidate, tokenIds)
        .estimateGas({from: voter})
      let answer = await contractHandler.contract.methods
        .lowerStake(candidate, tokenIds)
        .send({from: voter, gas: gas + 15000})
      let returnValues = answer.events.StakeLowered.returnValues
      // await redis.hdelAsync('frozen', returnValues.tokenId)
      let stake = {
        voter: returnValues.voter,
        candidate: returnValues.candidate,
        value: +returnValues.value,
      }
      this.voteCandidates()
      return stake
    } catch (error) {
      return error.toString()
    }
  }
}

const stateValidators = new StateValidators()

stateValidators.init()

export {stateValidators}
