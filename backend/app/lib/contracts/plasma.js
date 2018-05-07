'use strict';

import fs       from 'fs';
import net      from 'net';
import web3     from 'web3';

import config   from '../../config';

class ContractHandler {
  constructor (options = {}) {
    this.gethIpc = config.gethIpc;
    this.address = config.plasmaContractAddress;
    this.abi = require('./Root_abi.json');

    this.initContract();
  }

  initContract() {
    if (!fs.existsSync(this.gethIpc)) { throw new Error('Not exists geth.ipc'); }
    if (!web3.utils.isAddress(this.address)) { throw new Error('Contract address not valid'); }
    if (!this.abi) { throw new Error('Contract abi not set'); }
    if (!this.address) { throw new Error('Contract address not set'); }
    this.web3 = new web3(new web3.providers.IpcProvider(this.gethIpc, net));
    this.contract = new this.web3.eth.Contract(this.abi, this.address);
  }
}

const contractHandler = new ContractHandler();

export default contractHandler;
