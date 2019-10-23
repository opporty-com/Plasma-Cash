'use strict';
import {EventEmitter} from 'events'
import web3 from '../../root-chain/web3';

import abi from './erc20_abi.json';

class ContractHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.address = options.address;
    this.abi = abi;
    this.web3 = web3;
    this.watchEvents();
  }

  restartWatchEvents() {
    if (this.isWatchingEvents) return;

    if (this.web3._provider.connected) {
      this.watchEvents()
    } else {
      console.log('Delay restartWatchEvents');
      setTimeout(this.restartWatchEvents.bind(this), 60 * 1000)
    }
  }

  watchEvents() {
    if (!this.web3.utils.isAddress(this.address)) {
      throw new Error('Contract address not valid');
    }
    if (!this.abi) {
      throw new Error('Contract abi not set');
    }
    if (!this.address) {
      throw new Error('Contract address not set');
    }
    this.isWatchingEvents = true;

    this.web3._provider.on('error', (e) => {
      console.log("error this.web3._provider", e);
      this.isWatchingEvents = false;
      this.restartWatchEvents()
    });
    this.web3._provider.on('end', (e) => {
      console.log("end this.web3._provider", e);
      this.isWatchingEvents = false;
      this.restartWatchEvents()
    });
    this.contract = new this.web3.eth.Contract(this.abi, this.address);

    this.contract.events.allEvents((error, data) => {
      this.emit(data.event, error, data);
    });
  }



  async estimateApproveGas(spender, tokens, address) {
    return await this.contract.methods
      .approve(spender, tokens)
      .estimateGas({from: address});
  }


  async approve(spender, tokens, address, gas) {
    return await this.contract.methods
      .approve(spender, tokens)
      .send({from: address, gas: parseInt(gas) + 15000});
  }

  async allowance(spender, address) {
    return await this.contract.methods.allowance(address, spender).call();
  }


}

const contractHandler = new ContractHandler({address:"0x22A7D6fac0Da34B8B00374a851A1495a77673E75"});

export default contractHandler;
