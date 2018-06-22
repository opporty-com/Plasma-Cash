'use strict';

import web3 from 'lib/web3';
import config from 'config';

class ContractHandler {
  constructor (options = {}) {
    this.gethIpc = config.gethIpc;
    this.address = config.plasmaContractAddress;
    this.abi = require('./Root_abi.json');

    this.initContract();
  }

  initContract() {
    if (!web3.utils.isAddress(this.address)) { throw new Error('Contract address not valid'); }
    if (!this.abi) { throw new Error('Contract abi not set'); }
    if (!this.address) { throw new Error('Contract address not set'); }
    this.contract = new web3.eth.Contract(this.abi, this.address);
  }
}

const contractHandler = new ContractHandler();

export default contractHandler;
