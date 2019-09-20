'use strict';
import {EventEmitter} from 'events'
import web3 from '../web3';

import config from '../../config';
import abi from './Root_abi.json';

class ContractHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.address = config.plasmaContractAddress;
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

  async getCurrentBlock() {
    return await this.contract.methods.getCurrentBlock().call();
  }

  async estimateCreateDepositkGas(address) {
    return await this.contract.methods
      .deposit()
      .estimateGas({from: address});
  }

  async createDeposit({from, value, gas}) {
    const response = await this.contract.methods.deposit().send({from, value, gas})
    return response.events.DepositAdded.returnValues.tokenId;
  }


  async estimateSubmitBlockGas(hash, number, address) {
    return await this.contract.methods
      .submitBlock(hash, number)
      .estimateGas({from: address});
  }

  async submitBlock(hash, number, address, gas) {
    return await this.contract.methods
      .submitBlock(hash, number)
      .send({from: address, gas: parseInt(gas) + 15000});
  }

  async getTokenBalance(tokenId) {
    let amount = '0';
    try {
      amount = await this.contract.methods.getToken(tokenId).call();
    } catch (e) {
      console.log(e);
    }
    return amount.toString();
  }

  async checkProof(merkle, root, proof) {
    return await this.contract.methods.checkPatriciaProof(merkle, root, proof).call();
  }
}

const contractHandler = new ContractHandler();

export default contractHandler;
