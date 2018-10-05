'use strict'
import stubUTXO from 'lib/stubs/stubUTXO.json'
import PlasmaTransaction from 'child-chain/transaction'
import RLP from 'rlp'
import chai from 'chai'

var expect = chai.expect
let stubPlasmaTransaction
let stubDataForPlasma = stubUTXO[5]
let prevTransaction = new PlasmaTransaction(stubUTXO[4])


const expectPlasmaObject = (plasmaObject, typeInitTx) => {
  for (let a in plasmaObject) {
    let validObject = plasmaObject[a] instanceof Buffer ? a == 'prev_hash' ?
      plasmaObject[a] :
      plasmaObject[a].toString() :
      plasmaObject[a]
    if (a != 'prev_hash') {
      expect(validObject).to.equal(stubDataForPlasma[a])
    }
  }
}

describe('createTransactionsFromModel', () => {
  before(async function() {
    expect(stubDataForPlasma).to.exist
  })

  it('should create a prev_hash', () => {
    stubDataForPlasma.prev_hash = prevTransaction.getHash()

    expect(stubDataForPlasma.prev_hash).to.exist
  })

  it('should create PlasmaTransaction from Buffer', () => {
    let dataToEncode = [
      stubDataForPlasma.prev_hash,
      stubDataForPlasma.prev_block,
      stubDataForPlasma.token_id,
      stubDataForPlasma.new_owner,
      stubDataForPlasma.signature,
    ]

    let data = RLP.encode(dataToEncode)
    expect(data).to.be.an.instanceof(Buffer)
    stubPlasmaTransaction = new PlasmaTransaction(data)
    expectPlasmaObject(stubPlasmaTransaction, 'Buffer')
  })

  it('should create PlasmaTransaction from Array', () => {
    let data = []
    for (let a in stubDataForPlasma) {
      data.push(stubDataForPlasma[a])
    }
    data.push(stubDataForPlasma)

    expect(data).to.be.an.instanceof(Array)

    stubPlasmaTransaction = new PlasmaTransaction(data)

    expectPlasmaObject(stubPlasmaTransaction, 'Array')
  })

  it('should create PlasmaTransaction from object data', () => {
    expect(stubDataForPlasma).to.be.an.instanceof(Object)
    stubPlasmaTransaction = new PlasmaTransaction(stubDataForPlasma)
    expectPlasmaObject(stubPlasmaTransaction, 'object')
  })
})

setInterval(() => (true), 9999)
