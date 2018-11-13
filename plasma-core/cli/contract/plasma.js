'use strict'

const web3 = require('../lib/web3')
const config = require('../config')
/** */
class ContractHandler {
  constructor(options = {}) {
    this.gethIpc = config.gethIpc
    this.address = config.plasmaContractAddress
    this.abi = require('./Root_abi.json')
    this.initContract()
  }

  initContract() {
    if (!web3.utils.isAddress(this.address)) {
      throw new Error('Contract address not valid')
    }
    if (!this.abi) {
      throw new Error('Contract abi not set')
    }
    if (!this.address) {
      throw new Error('Contract address not set')
    }
    this.contract = new web3.eth.Contract(this.abi, this.address)
  }
}

const contractHandler = new ContractHandler()

module.exports = contractHandler
