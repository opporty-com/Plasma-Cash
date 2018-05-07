
import depositEventHandler from 'lib/handlers/DepositEventHandler';
import { createSignedTransaction } from 'lib/tx';
import levelDB from 'lib/db';
import web3     from 'lib/web3';
import Promise from 'bluebird';
import {
  blockNumberLength
} from 'lib/dataStructureLengths';
import config from "../config";
const { prefixes: { utxoPrefix } } = config;
const ethUtil = require('ethereumjs-util'); 
import RLP from 'rlp';
import txPool from 'lib/txPool';
const BN = ethUtil.BN;
import contractHandler from 'lib/contracts/plasma';

let statistic = {}

async function createDeposits(options = {}) {
  let accounts = await web3.eth.getAccounts();
  console.log('Accounts: ', accounts);
  
  for (let addr of accounts) {
    await web3.eth.personal.unlockAccount(addr, config.plasmaOperatorPassword, 0);
    console.log('unlockAccount', addr);
  }
  
  let deposits = options.deposits || 5;
  var nextAddressGen = getNextAddress(accounts);

  let created = 0;

  for (let i = 0; i < deposits; i++) {
    try {
      let address = nextAddressGen.next().value;
      let amount = new BN('100000000000000000');
      console.log('amount1', amount);
      let add = new BN('1000000000000000');
      console.log('add', add);
      add = add.mul(new BN(i + 1));
      console.log('add1', add);

      amount = amount.add(add).toString();
      console.log('amount', amount);
      
      contractHandler.contract.methods.deposit().estimateGas({from: address, value: amount})
        .then(gas => {
          console.log('gas', gas);
          return contractHandler.contract.methods.deposit().send({from: address, gas, value: amount});
        })
      
      created++;
    }
    catch (error){
      console.log('Create deposit error', error);
    }
  }
  return created;
}

function* getNextAddress(addresses) {
  let currentAddress = 0;
  let address;
  
  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0;
    }
    if (address && addresses[currentAddress] == address) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0;
        if (addresses[currentAddress] == address) {
          currentAddress++;
        }
      }
    }
    address = yield addresses[currentAddress];
  }
}

module.exports = { createDeposits };
