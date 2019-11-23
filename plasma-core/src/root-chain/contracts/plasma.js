'use strict';
import {EventEmitter} from 'events'
import web3 from '../web3';

import config from '../../config';
import abi from './Root_abi.json';
import * as ethUtil from "ethereumjs-util";

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

  async estimateStartExit({blockNum, txRpl, txPrevRpl, txProof, txPrevProof, address}) {
    return await this.contract.methods.startExit(blockNum, txRpl, txPrevRpl, txProof, txPrevProof).estimateGas({from: address});
  }

  async startExit({address, password, exitParams}) {
    const {blockNum, txRpl, txPrevRpl, txProof, txPrevProof, estimateGas} = exitParams;
    await this.web3.eth.personal.unlockAccount(address, password, 1000);
    const response = await this.contract.methods.startExit(blockNum, txRpl, txPrevRpl, txProof, txPrevProof)
      .send({from: address, gas: estimateGas});
    return response.events.ExitAdded.returnValues;
  }

  async getExit(tokenId) {
    return await this.contract.methods.getExit(tokenId).call();
  }

  async estimateDepositERC20(contract, value, address) {
    return await this.contract.methods
      .depositERC20(contract, value)
      .estimateGas({from: address});
  }

  async depositERC20(contract, value, address, gas) {
    return await this.contract.methods
      .depositERC20(contract, value)
      .send({from: address, gas: parseInt(gas) + 15000});
  }

  async estimateExitERC20(token, address) {
    return await this.contract.methods
      .exitERC20(token)
      .estimateGas({from: address});
  }

  async exitERC20(token, address, gas) {
    return await this.contract.methods
      .exitERC20(token)
      .send({from: address, gas: parseInt(gas) + 15000});
  }


  async estimateSetOperator(operator, status, address) {
    return await this.contract.methods
      .setOperator(operator, status)
      .estimateGas({from: address});
  }

  async setOperator(operator, status, address, gas) {
    return await this.contract.methods
      .setOperator(operator, status)
      .send({from: address, gas: parseInt(gas) + 15000});
  }

  async estimateSubmitBlockGas(hash, totalFee, address) {
    return await this.contract.methods
      .submitBlock(hash, totalFee)
      .estimateGas({from: address});
  }


  async submitBlock(hash, totalFee, address, gas) {
    return await this.contract.methods
      .submitBlock(hash, totalFee)
      .send({from: address, gas: parseInt(gas) + 150000});
  }


  async getTokenBalance(tokenId) {
    let amount = '0';
    try {
      const res = await this.contract.methods.getToken(tokenId).call();
      amount = res[0];
    } catch (e) {
      console.log(e);
    }
    console.log(amount);
    return amount.toString();
  }

  async checkProof(merkle, root, proof) {
    return await this.contract.methods.checkPatriciaProof(merkle, root, proof).call();
  }
}

const contractHandler = new ContractHandler();

export default contractHandler;
