'use strict'

const Promise = require('bluebird')
const request = require('supertest')
const app = require('../server.js')

import RLP from 'rlp'
import ethUtil from 'ethereumjs-util'
import web3 from '/lib/web3'
import config from 'config'
import chai from 'chai'
let expect = chai.expect

const accounts = [
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed',
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe',
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7',
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d',
]

describe('Test API', function() {
  let nextAddressGen

  before(async function() {
    expect(accounts).to.have.lengthOf.above(1)

    for (let addr of accounts) {
      await web3.eth.personal.unlockAccount(addr, config.plasmaNodePassword, 0)
      console.log('Unlock account: ', addr )
    }
    nextAddressGen = getNextAddress(accounts)
    nextAddressGen.next()
  })

  it('should create transactions from utxo', function (done) {
    let count = 0
    let start = Date.now()
    Promise.map(accounts, (address) => {
      return request(app)
        .get('/utxo')
        .query({address})
        .then(async function(res) {
          let utxos = res.body || []
          console.log('address ', address, ' utxos ', utxos && utxos.length)
          
          let txQueryAll = []

          for (let utxo of utxos) {
            let new_owner = nextAddressGen.next(address).value
            let query = createTx(utxo, address, new_owner)
              .then(createdTx => { 
                return request(app)
                  .post('/tx/signed')
                  .send(createdTx)
                  .then(res => {count++})
              })
            txQueryAll.push(query)
          }
          return Promise.all(txQueryAll)
        })
    })
    .then((res) => {
      console.log('Transactions Created: ', count)
      console.log('Time: ', Date.now() - start)
      done()
    })
	})
})


async function createTx(utxo, account, to) {
  let txData = {
    prev_hash: getTxHash(utxo),
    prev_block: utxo.blockNumber,
    token_id: utxo.token_id,
    new_owner: to
  }

  let txHash = getTxHash(txData, true)
  let signature = await web3.eth.sign(ethUtil.addHexPrefix(txHash), account)
  txData.signature = signature
  return txData
}

function* getNextAddress(addresses) {
  let currentAddress = 0
  let addressToExclude

  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0
    }
    if (addressToExclude && addresses[currentAddress] == addressToExclude) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0
        if (addresses[currentAddress] == addressToExclude) {
          currentAddress++
        }
      }
    }
    addressToExclude = yield addresses[currentAddress]
  }
}

function getTxHash(txData, excludeSignature) {
  let dataToEncode = [
    ethUtil.toBuffer(ethUtil.addHexPrefix(txData.prev_hash)),
    ethUtil.toBuffer(txData.prev_block),
    ethUtil.toBuffer(txData.token_id),
    ethUtil.toBuffer(txData.new_owner),
  ]
  if (!(excludeSignature)) {
    dataToEncode.push(ethUtil.toBuffer(txData.signature))
  }

  return ethUtil.sha3(RLP.encode(dataToEncode)).toString('hex')
}


