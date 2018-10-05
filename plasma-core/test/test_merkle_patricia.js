'use strict'

import chai from 'chai'

let expect = chai.expect
import PatriciaMerkle from 'lib/PatriciaMerkle'
import ethUtil from 'ethereumjs-util'
const BN = ethUtil.BN

describe('Merkle', function() {
  describe('checkProof', function() {
    it('should return true when proof is valid', function() {
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min
      }

      let leaves = []
      for (let i = 1; i <= 1000; i++) {
        let key = ethUtil.sha3(getRandomInt(100000, 100000000000000))
        key = new BN(key, 16).toString(10)
        leaves.push({
          key,
          hash: ethUtil.sha3(getRandomInt(100000, 100000000000000)),
        })
      }

      let tree = new PatriciaMerkle(leaves)
      tree.buildTree()
      let root = tree.getMerkleRoot()

      leaves.forEach((leaf) => {
        let proof = tree.getProof(leaf.key)
        let proofIsValid = tree.checkProof(proof, leaf.hash, root)
        expect(proofIsValid).to.be.true
      })
    })

    it('should return false when proof is not valid', function() {
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min
      }

      let leaves = []
      for (let i = 1; i <= 1000; i++) {
        let key = ethUtil.sha3(getRandomInt(100000, 100000000000000))
        key = new BN(key, 16).toString(10)
        leaves.push({
          key,
          hash: ethUtil.sha3(getRandomInt(100000, 100000000000000)),
        })
      }

      let tree = new PatriciaMerkle(leaves)
      tree.buildTree()
      let root = tree.getMerkleRoot()

      let randomHash = ethUtil.sha3(getRandomInt(100000, 100000000000000))
      leaves.forEach((leaf) => {
        let proof = tree.getProof(leaf.key)
        let proofIsValid = tree.checkProof(proof, randomHash, root)
        expect(proofIsValid).to.be.false
      })
    })

  })
})