import { Validator, setMinersCandidate, minersQueue, validateAddressForMining } from 'consensus'

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
      this.candidates.push(new Validator(address))
      return 'ok'
    } else {
      return 'already exist'
    }
  }

  getCandidates() {
    return this.candidates
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

    let thirtyPercent = Math.floor(candidates.length / 100 * 30)
    let validators = candidates.splice(0, thirtyPercent)

    for (let i = 0; i < validators.length; i++) {
      let address = validators[i].getAddress()
      let isMiner = await validateAddressForMining(address)
      if (!isMiner) {
        await setMinersCandidate(validators[i].getAddress())
      }
    }

    for (let i = 0; i < candidates.length; i++) {
      let address = candidates[i].getAddress()
      let isMiner = await validateAddressForMining(address)
      if (isMiner) {
        minersQueue.delMiner(address)
      }
    }
    return validators
  }

  reVote(voter) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        this.votes += 1
      }
    }
    if (this.votes >= 2) {
      this.voteCandidates()
      this.votes = 0
    }
  }

  removeCandidate(address) {
    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].getAddress() === address) {
        if (validateKeyForMining(address)) {
          minersQueue.delMiner(address)
        }
        this.candidates.splice(i, 1)
      }
    }
  }

  // Понижение ставки или удаление. Проверяет есть ли такая ставка, если есть, то проверяет есть ли такой кандидат,
  // если есть, то понижается ставка или удаляется, если она равна или больше количества существующей
  toLowerStake(stake) {
    let candidateExists = false
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter || this.stakes[i].candidate === stake.candidate) {
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            this.candidates[i].toLowerStake({ voter: stake.voter, value: stake.value })
            candidateExists = true
          }
        }
        if (candidateExists) {
          if (this.stakes[i].value <= stake.value) {
            this.stakes.splice(i, 1)
          } else {
            this.stakes[i].value -= stake.value
          }
        } else {
          throw new Error('Denieded stake on a non-existent candidate')
        }
      }
    }
  }

  // сначала проверка, есть ли ставка с таким вотером и кандидатом,
  // если есть, то проверяется есть ли такой кандидат и ставка просто увеличивается, если нет, то она уменьшается
  // если такой ставки нет, то она создается
  async addStake(stake) {

    let candidateExists = false,
      stakeExists = false

    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === stake.voter || this.stakes[i].candidate === stake.candidate) {
        stakeExists = true
        for (let i = 0; i < this.candidates.length; i++) {
          if (this.candidates[i].getAddress() === stake.candidate) {
            this.candidates[i].addStake({ voter: stake.voter, value: stake.value })
            candidateExists = true
          }
        }
        if (candidateExists) {
          this.stakes[i].value += stake.value
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
