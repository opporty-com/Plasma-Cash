'use strict';

var assert = require('assert');
import chai           from 'chai';
var expect = chai.expect;

import SparseMerkle   from '../app/lib/SparseMerkle';
import web3           from '../app/lib/web3';
import ethUtil        from 'ethereumjs-util';
import { getAllUtxos } from '../app/lib/tx';
import { createSignedTransaction } from '../app/lib/tx';
import config from "../app/config";
import RLP from 'rlp';
import txPool from '../app/lib/txPool';
import contractHandler from '../app/lib/contracts/plasma';
import depositEventHandler from '../app/lib/handlers/DepositEventHandler';
const BN = ethUtil.BN;

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
    prev_hash: utxo.getHash().toString('hex'),
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
  
  before(async function() {
    // accounts = await web3.eth.getAccounts();
    
	    
    for (let addr of accounts) {
      await web3.eth.personal.unlockAccount(addr, config.plasmaOperatorPassword, 0);
      console.log('    unlock account - ' , addr )
    }

    
    expect(accounts).to.have.lengthOf.above(1);
    nextAddressGen = getNextAddress(accounts);
    nextAddressGen.next();
  });

  it('should return test accounts list from ethernode keystore excluding operator address', async function () {
    expect(accounts).to.have.lengthOf.above(1);
  })
  
  // describe('Check Deposit Event Handle', async function () {
  //   let utxoBeforeTestCount;
  //   before(async function() {
  //     let utxosBeforeTest = await getAllUtxos(null, {});
  //     utxoBeforeTestCount = utxosBeforeTest.length;
  //   });
  // 
  //   let amount = new BN('322000000000000000');
  //   let additional = new BN('1000000000000000');
  // 
  //   it('should create deposits', async function () {
  //       let address = nextAddressGen.next().value;
  // 
  //       let depostisToCreate = [];
  // 
  //       for (let i = 0; i < 100; i++) {
  //         let data = {
  //           depositor: nextAddressGen.next().value,
  //           amount: amount.add(additional.mul(new BN(i + 1))).toString(),
  //           depositBlock:  new BN(ethUtil.sha3(Date.now() + i), 16).toString(10),
  //           blockNumber: 3
  //         }
  //         depostisToCreate.push(data);
  // 
  //         await depositEventHandler({ returnValues: data });
  //       }
  // 
  //       expect(depostisToCreate.length).to.equal(txPool.length);
  // 
  //       let newBlock = await txPool.createNewBlock();
  // 
  //       let newUtxos = await getAllUtxos(null, {});
  // 
  //       expect(newUtxos.length).to.equal(utxoBeforeTestCount + depostisToCreate.length);
  //   })
  // 
  // })
  
  describe('Check Transaction Creation', async function () {
    it('should get correct address from created trasaction signature', async function () {
      let utxos = await getAllUtxos(null, {});
      let utxo = utxos.find( u => accounts.some(a => ethUtil.addHexPrefix(u.new_owner.toString('hex').toLowerCase()) == a.toLowerCase()));
      expect(utxo).to.exist;
      
      let account = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase();
      let createdTx = await createTx(utxo, account, nextAddressGen.next(account).value);
      
      expect(createdTx.validate()).to.be.true; 

      let addressFromSignature = createdTx.getAddressFromSignature(true);

      expect(addressFromSignature).to.equal(account);
    })
  })

  
  describe('Check Block Creation', async function () {
    let utxosBeforeTest;
  
    before(async function() {
      utxosBeforeTest = await getAllUtxos(null, {});
      expect(utxosBeforeTest).to.have.lengthOf.above(1);
    });
  
    it('should create transactions from utxos and write block', async function () {
      let start = Date.now();
      let errors = 0;
      let added = 0;
      let addedPool = 0;
  
      let queryAll = [];
      let txQueryAll = [];
      let createdTxs = [];

      var t0 = Date.now();
  
      for (let utxo of utxosBeforeTest) {
        let ownerAccount = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase();
        txQueryAll.push(createTx(utxo, ownerAccount, nextAddressGen.next(ownerAccount).value).then( createdTx => createdTxs.push(createdTx)))
      }
      await Promise.all(txQueryAll);
  
      for (let createdTx of createdTxs) {
        queryAll.push(txPool.addTransaction(createdTx));
      }
  
      await Promise.all(queryAll)
      var t1 = Date.now();
      console.log('      txs created: ', createdTxs.length);

      console.log('      time - ', (t1 - t0)/1000 ,' s')
      
      expect(txPool.length).to.equal(utxosBeforeTest.length);
  
      let newBlock = await txPool.createNewBlock();
      expect(newBlock).to.exist;
  
      let newUtxos = await getAllUtxos(null, {});
  
      newUtxos.forEach(tx => {
        let proof = newBlock.merkle.getProof({ key: tx.token_id });
        let proofIsValid = newBlock.merkle.checkProof(proof, tx.getHash().toString('hex'), newBlock.merkleRootHash);
  
        expect(proofIsValid);
      })
  
    })
  })

});
