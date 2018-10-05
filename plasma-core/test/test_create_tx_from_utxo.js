'use strict'
import stubUTXO from 'lib/stubs/stubUTXO.json'
import {createSignedTransaction} from 'child-chain'
import PlasmaTransaction from 'child-chain/transaction'
import RLP from 'rlp'
import chai from 'chai'
import ethUtil from 'ethereumjs-util'

let expect = chai.expect
let accounts = ['0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70'.toLowerCase(),
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed'.toLowerCase(),
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe'.toLowerCase(),
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7'.toLowerCase(),
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'.toLowerCase(),
]
let nextAddressGen = getNextAddress(accounts)
let alltransactions = []
let utxos = []

describe('TxMemPool', () => {
  before(async function() {
    stubUTXO.map((tx) => {
      utxos['utxo_' + tx.blockNumber] = new PlasmaTransaction(tx)
    })
    nextAddressGen.next()
    expect(utxos).to.exist
  })

  it('should create a correct signature', () => {
    const index = 2
    const utxoN = utxos[`utxo_${index}`]

    setInterval(() => (true), 9999)

    let blockNumber = index
    let privateKey = 0xC2D7CF95645D33006175B78989035C7c9061d3F9
    let txData = {
      prev_hash: utxoN.getHash().toString('hex'),
      prev_block: blockNumber,
      token_id: utxoN.token_id.toString(),
      new_owner: nextAddressGen.next(utxoN.new_owner).value,
    }

    let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash),
      txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner]
    let txRlpEncoded =
    ethUtil.hashPersonalMessage(ethUtil.sha3(RLP.encode(txDataForRlp)))

    if (utxoN.new_owner instanceof Buffer) {
      utxoN.new_owner =
      ethUtil.addHexPrefix(utxoN.new_owner.toString('hex')).toLowerCase()
    }

    expect(txRlpEncoded).to.be.an.instanceof(Buffer)

    let keyFroEcsign = Buffer.from(privateKey.toString(16))

    expect(keyFroEcsign).to.be.an.instanceof(Buffer)

    let signature = ethUtil.ecsign(txRlpEncoded, keyFroEcsign)
    expect(signature).to.be.an.instanceof(Object)
    txData.signature =
    ethUtil.toRpcSig(signature.v, signature.r, signature.s).toString('hex')
    expect(txData.signature).to.have.lengthOf.above(1)
  })

  it('should create array of transactions', () => {
    for (let i in utxos) {
      let utxo = utxos[i]

      let blockNumber = parseInt(i.split('_')[1])

      try {
        let txData = {
          prev_hash: utxo.getHash().toString('hex'),
          prev_block: blockNumber,
          token_id: utxo.token_id.toString(),
          new_owner: nextAddressGen.next(utxo.new_owner).value,
        }
        txData.signature = utxo.new_owner
        let createdTx = createSignedTransaction(txData)
        alltransactions.push(createdTx)
      } catch (e) {
        console.log(e)
      }
    }

    let utxosLenght = objLength(utxos)

    expect(alltransactions.length).to.equal(utxosLenght);
  });
})

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

let objLength = (obj) => {
  let length = 0
  for (let a in utxos) {
    length++
  }
  return length
}
