'use strict';

var assert = require('assert');
import SparseMerkle from '../app/lib/SparseMerkle';
import ethUtil from 'ethereumjs-util';
const BN = ethUtil.BN;

describe('Merkle', function() {
  describe('checkProof', function() {
    it('should return true when proof is valid', function() {
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
      }

      let leaves = [];

      for (let i = 1; i < 500; i++) {
        let key = ethUtil.sha3(getRandomInt(100000, 100000000000000));
        key = new BN(key, 16).toString(10);
        leaves.push({
          key,
          hash: ethUtil.sha3(getRandomInt(100000, 100000000000000))
        });
      }

      let tree = new SparseMerkle(leaves);
      tree.buildTree();

      leaves.forEach(leaf => {
        let proof = tree.getProof(leaf);
        let proofIsValid = tree.checkProof(proof, leaf.hash, tree.getMerkleRoot());

        assert(proofIsValid);
      });
    });

    it('should return false when proof is not valid', function() {
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
      }

      let leaves = [];
      for (let i = 1; i < 500; i++) {
        let key = ethUtil.sha3(getRandomInt(100000, 100000000000000));
        key = new BN(key, 16).toString(10);
        leaves.push({
          key,
          hash: ethUtil.sha3(getRandomInt(100000, 100000000000000))
        });
      }

      let tree = new SparseMerkle(leaves);
      tree.buildTree();

      let randomHash = ethUtil.sha3(getRandomInt(100000, 100000000000000));
      leaves.forEach(leaf => {
        let proof = tree.getProof(leaf);
        let proofIsValid = tree.checkProof(proof, randomHash, tree.getMerkleRoot());
        assert(!proofIsValid);
      });
    });
  });
});
