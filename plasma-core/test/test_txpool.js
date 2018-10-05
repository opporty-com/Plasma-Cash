'use strict'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import stubTransactions from 'lib/stubs/stubTX.json'
import PlasmaTransaction from 'child-chain/transaction'
import chai from 'chai';
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

let tx3 = new PlasmaTransaction(stubTransactions[3])
let tx4 = new PlasmaTransaction(stubTransactions[4])
let tx5 = new PlasmaTransaction(stubTransactions[5])
tx4.plev_hash = tx3.getHash()
tx5.plev_hash = tx4.getHash()
let newTx4FromRLP = new PlasmaTransaction(tx4.getRlp(false))
let newTx5FromRLP = new PlasmaTransaction(tx5.getRlp(false))

describe('TxMemPool', () => {
  it('should be exist', async () => {
    expect(TxMemPool).should.be.exist
  })

  it('should accept and add transaction into pool', async () => {
    await TxMemPool.acceptToMemoryPool(txMemPool, tx5)
    await TxMemPool.acceptToMemoryPool(txMemPool, tx4)
    let tsx = await txMemPool.txs()
    tsx.should.include.something.that.deep.equals(newTx4FromRLP)
    tsx.should.include.something.that.deep.equals(newTx5FromRLP)
  });

  it('should check exist stransaction', async () => {
    let hash = tx5.getHash()
    let answer = await txMemPool.exists(hash)
    expect(answer).to.be.true
  });

  it('should remove transaction', async () => {
    await txMemPool.remove(tx5)
    let tsx = await txMemPool.txs()
    tsx.should.not.include.something.that.deep.equals(newTx5FromRLP)
    let hash = tx5.getHash()
    let answer = await txMemPool.exists(hash)
    expect(answer).to.be.false
  })

  it('should clear txpool', async () => {
    await txMemPool.clear()
    let tsx = await txMemPool.txs()
    expect(tsx).to.be.empty
  });

  after(async () => {
    process.exit()
  })
})
