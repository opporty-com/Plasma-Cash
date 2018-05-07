'use strict';

import MerkleTools from 'merkle-tools';

import { PlasmaTransaction } from './tx';
import RLP from 'rlp';
import ethUtil from 'ethereumjs-util';

class Block {
  constructor (data) {
    if (Buffer.isBuffer(data)) {
      let decodedData = RLP.decode(data);
      this.blockNumber = decodedData && decodedData[0];
      this.merkleRootHash = decodedData && decodedData[1];
      this.transactions = decodedData && decodedData[2];
    } else if (data && typeof data === 'object') {
      this.blockNumber = data.blockNumber;
      this.transactions = data.transactions || [];

      this.merkle = new MerkleTools({ hashType: 'SHA3-256' });
      for (let i = 0, l = this.transactions.length; i < l; i++) {
        let tx = this.transactions[i];
        this.merkle.addLeaf(tx.merkleHash());
      }

      this.merkle.makeTree(false);
      this.merkleRootHash = this.merkle.getMerkleRoot();
    }
  }

  

  getRlp() {
    if (this._rlp) {
      return this._rlp;
    }
    let transactions = this.transactions;
    if (transactions[0] && transactions[0] instanceof PlasmaTransaction) {
      transactions = transactions.map(tx => tx.getRaw());
    }

    this._rlp = RLP.encode([this.blockNumber, this.merkleRootHash, transactions]);
    return this._rlp;
  }

  toJson() {
    let data = [
      this.blockNumber,
      this.merkleRootHash,
      this.transactions
    ];

    return ethUtil.baToJSON(data);
  }
  
  getJson() {
    let data = {
      blockNumber: ethUtil.bufferToInt(this.blockNumber.toString()),
      merkleRootHash: this.merkleRootHash.toString('hex'),
      transactions: []
    };
    let transactions = [];

    for (let txRlp of this.transactions) {
      let tx = new PlasmaTransaction(txRlp);
      data.transactions.push(tx.getJson());
    }
    return data;
  }
}

module.exports = Block;
