'use strict'

import PatriciaMerkle from 'lib/PatriciaMerkle'
import PlasmaTransaction from 'child-chain/transaction'
import RLP from 'rlp'
import ethUtil from 'ethereumjs-util'

/** Class representing a blockchain block. */
class Block {
  constructor(data) {
    if (Buffer.isBuffer(data)) {
      let decodedData = RLP.decode(data)
      this.blockNumber = decodedData && decodedData[0]
      this.merkleRootHash = decodedData && decodedData[1]
      this.transactions = decodedData && decodedData[2]
    } else if (data && typeof data === 'object') {
      this.blockNumber = data.blockNumber
      this.transactions = data.transactions || []

      let leaves = []
      for (let i = 0, l = this.transactions.length; i < l; i++) {
        let tx = this.transactions[i]
        leaves.push({key: tx.tokenId, hash: tx.getHash()})
      }

      this.txCount = leaves.length
      this.merkle = new PatriciaMerkle(leaves)
      this.merkle.buildTree()
      this.merkleRootHash = this.merkle.getMerkleRoot()
    }
  }

  getRlp() {
    if (this._rlp) {
      return this._rlp
    }
    let transactions = this.transactions
    if (transactions[0] && transactions[0] instanceof PlasmaTransaction) {
      transactions = transactions.map((tx) => tx.getRaw())
    }

    this._rlp = RLP.encode([this.blockNumber,
      this.merkleRootHash, transactions])
    return this._rlp
  }

  toJson() {
    let data = [
      this.blockNumber,
      this.merkleRootHash,
      this.transactions,
    ]

    return ethUtil.baToJSON(data)
  }

  getProof(tokenId, returnhex) {
    if (!this.merkle) {
      this.buildTree()
    }

    if (!(tokenId instanceof Buffer)) {
      tokenId = ethUtil.toBuffer(ethUtil.stripHexPrefix(tokenId))
    }

    return this.merkle.getProof(tokenId, returnhex)
  }

  checkProof(proof, hash) {
    if (!this.merkle) {
      this.buildTree()
    }

    return this.merkle.checkProof(proof, hash, this.merkleRootHash)
  }

  buildTree() {
    if (this.transactions[0] &&
      !(this.transactions[0] instanceof PlasmaTransaction)) {
      this.transactions = this.transactions.map(
        (tx) => new PlasmaTransaction(tx))
    }
    let leaves = this.transactions.map((tx) => {
      return {key: tx.tokenId, hash: tx.getHash()}
    })

    this.merkle = new PatriciaMerkle(leaves)
    this.merkle.buildTree()
    this.merkleRootHash = this.merkle.getMerkleRoot()
  }

  getJson() {
    let data = {
      blockNumber: ethUtil.bufferToInt(this.blockNumber.toString()),
      merkleRootHash: this.merkleRootHash.toString('hex'),
    }

    let transactions = this.transactions

    if (transactions[0] && !(transactions[0] instanceof PlasmaTransaction)) {
      transactions = transactions.map(
        (tx) => (new PlasmaTransaction(tx)).getJson())
    } else {
      transactions = transactions.map(
        (tx) => tx.getJson())
    }

    data.transactions = transactions
    return data
  }

  getTxByTokenId(tokenId) {
    let transaction
    if (!(tokenId instanceof Buffer)) {
      tokenId = ethUtil.toBuffer(ethUtil.stripHexPrefix(tokenId))
    }
    let txsAreRlp = this.transactions[0] &&
    !(this.transactions[0] instanceof PlasmaTransaction)
    let txsTokenIdKey = txsAreRlp ? 2 : 'tokenId'
    transaction = this.transactions.find((tx) => tx &&
    tokenId.equals(tx[txsTokenIdKey]))

    if (transaction && !(transaction instanceof PlasmaTransaction)) {
      transaction = new PlasmaTransaction(transaction)
    }

    return transaction
  }
}


export default Block
