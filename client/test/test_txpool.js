'use strict';
import { txMemPool, TxMemPool } from 'child-chain/TxMemPool';
import assert from 'assert';
describe('TxMemPool', () => {
  it('should valid txmempool', () => {
    assert.ok(txMemPool);
  });

  it('should valid txmempool2', () => {
    assert.ok(txMemPool);
  });

  after(async () => {
    process.exit();
  });
});