
/** Candidate */
class Candidate {
  constructor(address) {
    this.address = address
    this.stakes = []
    this.weight = 0
    this.isValidator = false
  }

  addStake({voter, value}) {
    let stakeExists = false
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        stakeExists = true      
        this.stakes[i].value += value
        this.weight += value
      }
    }
    if (!stakeExists) {
      this.stakes.push({voter, value})
      this.weight += value
    }
  }

  toLowerStake({voter, value}) {
    for (let i = 0; i < this.stakes.length; i++) {
      if (this.stakes[i].voter === voter) {
        if (this.stakes[i].value <= value) {
          this.weight -= this.stakes[i].value
          this.stakes.splice(i, 1)
        } else {
          this.stakes[i].value -= value
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

  isValidator() {
    return this.isValidator
  }
}

export {Candidate}
