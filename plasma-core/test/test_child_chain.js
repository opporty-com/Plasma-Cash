'use strict'

import chai from 'chai'
let expect = chai.expect
import web3 from 'lib/web3'
import ethUtil from 'ethereumjs-util'
import {createSignedTransaction, getAllUtxos} from 'child-chain'
import config from 'config'
import RLP from 'rlp'
import {txMemPool} from 'child-chain/TxMemPool'


function* getNextAddress(addresses) {
  let currentAddress = 0
  let addressToExclude

  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0;
    }
    if (addressToExclude && addresses[currentAddress] == addressToExclude) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0
        if (addresses[currentAddress] == addressToExclude) {
          currentAddress++
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
    new_owner: to,
  };

  let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash), txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner];
  let txRlpEncoded = ethUtil.sha3(RLP.encode(txDataForRlp)).toString('hex')

  let signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), account)
  txData.signature = signature
  let createdTx = await createSignedTransaction(txData)
  return createdTx
}

let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70',
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed', 
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe',
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7',
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d',
]

describe('ChildChain', function () {
  let nextAddressGen
  
  before(async function() {
    for (let addr of accounts) {
      await web3.eth.personal.unlockAccount(addr, config.plasmaNodePassword, 0)
      console.log('unlock account: ', addr )
    }
    
    expect(accounts).to.have.lengthOf.above(1)
    nextAddressGen = getNextAddress(accounts)
    nextAddressGen.next()
  });

  it('should return test accounts list from ethernode keystore excluding operator address', async function() {
    expect(accounts).to.have.lengthOf.above(1)
  })
  
  describe('Check Transaction Creation', async function() {
    it('should get correct address from created trasaction signature', async function() {
      let utxos = await getAllUtxos(null, {})
      let utxo = utxos.find((u) => accounts.some((a) => ethUtil.addHexPrefix(u.new_owner.toString('hex').toLowerCase()) == a.toLowerCase()));
      expect(utxo).to.exist
      
      let account = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase();
      let txData = {
        prev_hash: utxo.getHash().toString('hex'),
        prev_block: utxo.blockNumber,
        token_id: utxo.token_id.toString(),
        new_owner: nextAddressGen.next(account).value
      };

      let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash), txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner]
      let txRlpEncoded = ethUtil.sha3(RLP.encode(txDataForRlp)).toString('hex')

      let signature = await web3.eth.sign(ethUtil.addHexPrefix(txRlpEncoded), account)
      txData.signature = signature
      let createdTx = await createSignedTransaction(txData)
      
      expect(RLP.encode(txDataForRlp).toString('hex')).to.equal(createdTx.getRlp(true).toString('hex'));
      expect(createdTx.validate()).to.be.true

      let addressFromSignature = createdTx.getAddressFromSignature(true)

      expect(addressFromSignature).to.equal(account)
    })
  })

  
  describe('Check Block Creation', async function() {
    let utxosBeforeTest
  
    before(async function() {
      utxosBeforeTest = await getAllUtxos(null, {})
      expect(utxosBeforeTest).to.have.lengthOf.above(1)
    })
  
    it('should create transactions from utxos and write block', async function() {
      let queryAll = []
      let txQueryAll = []
      let createdTxs = []
  
      let t0 = Date.now()
  
      for (let utxo of utxosBeforeTest) {
        let ownerAccount = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase()
        txQueryAll.push(createTx(utxo, ownerAccount, nextAddressGen.next(ownerAccount).value).then((createdTx) => createdTxs.push(createdTx)))
      }
      await Promise.all(txQueryAll)
  
      for (let createdTx of createdTxs) {
        queryAll.push(TXMemPool.acceptToMemoryPool(txMemPool, createdTx))
      }
  
      await Promise.all(queryAll)
      let t1 = Date.now()
      console.log('txs created: ', createdTxs.length)
      console.log('time: ', (t1 - t0)/1000 ,' s')

      expect(txMemPool.length).to.equal(utxosBeforeTest.length)

      let newBlock = await txMemPool.createNewBlock()
      expect(newBlock).to.exist

      let newUtxos = await getAllUtxos(null, {})

      newUtxos.forEach((tx) => {
        let proof = newBlock.merkle.getProof(tx.token_id)
        let proofIsValid = newBlock.merkle.checkProof(proof, tx.getHash(), newBlock.merkleRootHash)
        expect(proofIsValid).to.be.true
      })
  
    })
  })

})
