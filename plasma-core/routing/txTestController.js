
import web3 from 'lib/web3'
import Promise from 'bluebird'
import config from 'config'
const ethUtil = require('ethereumjs-util')
import RLP from 'rlp'

import {getAllUtxosWithKeys, createSignedTransaction} from 'child-chain'

import contractHandler from 'root-chain/contracts/plasma'

const BN = ethUtil.BN

let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70'.toLowerCase(),
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed'.toLowerCase(),
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe'.toLowerCase(),
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7'.toLowerCase(),
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'.toLowerCase(),
]

async function createDeposits(options = {}) {
  for (let addr of accounts) {
    await web3.eth.personal.unlockAccount(addr,
      config.plasmaNodePassword, 90000)
    console.log('unlockAccount', addr)
  }
  let deposits = options.deposits || 5
  let nextAddressGen = getNextAddress(accounts)

  let created = 0
  for (let i = 0; i < deposits; i++) {
    try {
      let address = nextAddressGen.next().value
      let amount = new BN('1000000000000000')
      let add = new BN('10000000000000')
      add = add.mul(new BN(i + 1))
      amount = amount.add(add).toString()

      contractHandler.contract.methods.deposit().estimateGas(
        {from: address, value: amount})
        .then((gas) => {
          console.log('done deposit to contract!')
          return contractHandler.contract.methods.deposit().send(
            {from: address, gas, value: amount})
        }).catch((error) => {
          console.log('error', error.toString())
        })
      created++
    } catch (error) {
      console.log('Create deposit error', error)
    }
  }
  return created
}


let prkeys = {}
prkeys[accounts[0]] =
  Buffer.from('de3385a80c15c12bc7dd7800f5d383229569269016e6501a2714a3a77885007a', 'hex')
prkeys[accounts[1]] =
  Buffer.from('86737ebcbdfda1c14a069782b585fed4fb15847206ca179ea8988161ddbb8ad6', 'hex')
prkeys[accounts[2]] =
  Buffer.from('06889a2975e9db1487e33ea76f82a034660de671d0594e9470d4f7be4b6feaf1', 'hex')
prkeys[accounts[3]] =
  Buffer.from('723851e910975a4ff44b2ec28b719c42ae3c9ea33c187abaa018292a02d5e9a9', 'hex')
prkeys[accounts[4]] =
  Buffer.from('25d9bb435e7d96e692054668add7f8b857567b2075b9e2f6b0659c4b6c7ed31c', 'hex')

/** Test transaction creator */
class TestTransactionsCreator {
  constructor() {
    this.ready = false
    this.utxos = []
    this.alltransactions = []

    this.nextAddressGen = getNextAddress(accounts)
    this.nextAddressGen.next()
    this.blockCreatePromise = Promise.resolve(true)
  }

  async createTransactionsFromUTXO() {
    this.utxos = await getAllUtxosWithKeys()
    this.alltransactions = []

    for (let i in this.utxos) {
      if (Object.prototype.hasOwnProperty.call(this.utxos, i)) {
        let utxo = this.utxos[i]
        let blockNumber = parseInt(i.split('_')[1])

        try {
          let txData = {
            prevHash: utxo.getHash().toString('hex'),
            prevBlock: blockNumber,
            tokenId: utxo.tokenId.toString(),
            newOwner: this.nextAddressGen.next(utxo.newOwner).value,
          }
          let txDataForRlp =
            [ethUtil.addHexPrefix(txData.prevHash),
              txData.prevBlock,
              ethUtil.toBuffer(txData.tokenId),
              txData.newOwner]
          let txRlpEncoded =
            ethUtil.hashPersonalMessage(ethUtil.sha3(RLP.encode(txDataForRlp)))

          if (utxo.newOwner instanceof Buffer) {
            utxo.newOwner =
              ethUtil.addHexPrefix(utxo.newOwner.toString('hex')).toLowerCase()
          }
          let signature = ethUtil.ecsign(txRlpEncoded, prkeys[utxo.newOwner])

          txData.signature = ethUtil.toRpcSig(signature.v,
            signature.r,
            signature.s).toString('hex')
          let createdTx = createSignedTransaction(txData)
          this.alltransactions.push(createdTx)
        } catch (e) {
          console.log(e)
        }
        console.log('TXcount - ', this.alltransactions.length)
      }
    }
  }

  async init() {
    try {
      for (let address of accounts) {
        await web3.eth.personal.unlockAccount(address,
          config.plasmaNodePassword, 0)
        console.log('Unlock account: ', address)
      }
      await this.createTransactionsFromUTXO()
      setInterval(() => this.createTransactionsFromUTXO(), 60000)
    } catch (err) {
      console.log('error', err)
      this.ready = false
    }
  }
}
function* getNextAddress(addresses) {
  let currentAddress = 0
  let addressToExclude
  while (true) {
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

const testTransactionsCreator = new TestTransactionsCreator

// if (config.isDevelopment)
testTransactionsCreator.init()

export {testTransactionsCreator, createDeposits}
