'use strict';

var assert = require('assert');
import chai           from 'chai';
var expect = chai.expect;

import web3           from 'lib/web3';
import ethUtil        from 'ethereumjs-util';
import { getAllUtxos, createSignedTransaction } from 'child-chain';
import config from "config";
import RLP from 'rlp';
import { txMemPool, TxMemPool } from 'child-chain/TxMemPool';
import { depositEventHandler } from 'child-chain/eventsHandler';
const BN = ethUtil.BN;
import yargs from 'yargs';
const argv = yargs.argv;

function* getNextAddress(addresses) {
  let currentAddress = 0;
  let addressToExclude;

  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0;
    }
    if (addressToExclude && addresses[currentAddress] == addressToExclude) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0;
        if (addresses[currentAddress] == addressToExclude) {
          currentAddress++;
        }
      }
    }
    addressToExclude = yield addresses[currentAddress];
  }
}

async function createTx(utxo, account, to) {
  let txData = {
    prev_hash:  utxo.getHash().toString('hex'),
    prev_block: utxo.blockNumber,
    token_id: utxo.token_id.toString(),
    new_owner: to
  };

  let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash), txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner];
  let txRlpEncoded = ethUtil.sha3(RLP.encode(txDataForRlp)).toString('hex');

  let signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), account);
  txData.signature = signature;
  let createdTx = await createSignedTransaction(txData);
  return createdTx;
}

let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70',
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed', 
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe',
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7',
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'
]

describe('ChildChain', function () {
  
  var nextAddressGen;
  let depositCount = argv.deposit_count || 10;
  console.log('deposits to create: ' , depositCount);
  
  before(async function() {
    for (let addr of accounts) {
      await web3.eth.personal.unlockAccount(addr, config.plasmaNodePassword, 0);
      console.log('unlock account: ' , addr )
    }
    
    expect(accounts).to.have.lengthOf.above(1);
    nextAddressGen = getNextAddress(accounts);
    nextAddressGen.next();
  });
  
  describe('Check Deposit Event Handle', async function () {
    let utxoBeforeTestCount;
    before(async function() {
      let utxosBeforeTest = await getAllUtxos(null, {});
      utxoBeforeTestCount = utxosBeforeTest.length;
    });
  
    let amount = new BN('322000000000000000');
    let additional = new BN('1000000000000000');
  
    it('should create deposits', async function () {
        let address = nextAddressGen.next().value;
  
        let depostisToCreate = [];
  
        for (let i = 0; i < depositCount; i++) {
          let data = {
            depositor: nextAddressGen.next().value,
            amount: amount.add(additional.mul(new BN(i + 1))).toString(),
            depositBlock:  new BN(ethUtil.sha3(Date.now() + i), 16).toString(10),
            blockNumber: 3
          }
          depostisToCreate.push(data);
  
          await depositEventHandler({ returnValues: data });
        }

        expect(depostisToCreate.length).to.equal(txMemPool.length);
  
        let newBlock = await txMemPool.createNewBlock();
  
        let newUtxos = await getAllUtxos(null, {});
  
        expect(newUtxos.length).to.equal(utxoBeforeTestCount + depostisToCreate.length);
    })
  
  })
    
});
