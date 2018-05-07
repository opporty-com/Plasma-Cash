'use strict';

import ethUtil from 'ethereumjs-util';

class Merkle {
  constructor (depth, leaves) {
    this.leaves = {};
    leaves.forEach(leaf => {
      this.leaves[this.toBinaryString(leaf.key)] = ethUtil.toBuffer(leaf.hash);
    });

    this.depth = depth;
    this.defaultHashes = [ethUtil.sha3(new Buffer(32))];

    for (let index = 0; index < this.depth - 1; index++) {
      this.defaultHashes.push(ethUtil.sha3(Buffer.concat([ this.defaultHashes[index], this.defaultHashes[index] ])));
    }
  }

  getMerkleRoot() {
    return this.levels[0] && this.levels[0].merkleRoot;
  }

  buildTree() {
    if (Object.keys(this.leaves).length > 0) {
      this.levels = [];
      this.levels.unshift(this.leaves);
      for (let level = 0; level < this.depth; level++) {
        let currentLevel = this.levels[0];
        let nextLevel = {};

        Object.keys(currentLevel).forEach(leafKey => {
          let leafHash = currentLevel[leafKey];
          let isEvenLeaf = this.isEvenLeaf(leafKey);
          let parentLeafKey = leafKey.slice(0, -1);
          let neighborLeafKey = parentLeafKey + (isEvenLeaf ? '1' : '0');

          let neighborLeafHash = currentLevel[neighborLeafKey];
          if (!neighborLeafHash) {
            neighborLeafHash = this.defaultHashes[level];
          }

          if (!nextLevel[parentLeafKey]) {
            let parentLeafHash = isEvenLeaf ? ethUtil.sha3(Buffer.concat([ leafHash, neighborLeafHash ])) : ethUtil.sha3(Buffer.concat([ neighborLeafHash, leafHash ]));
            if (level == this.depth - 1) {
              nextLevel['merkleRoot'] = parentLeafHash;
            } else {
              nextLevel[parentLeafKey] = parentLeafHash;
            }
          }
        });

        this.levels.unshift(nextLevel);
      }
    }
  }

  getProof(leaf, returnBinary) {
    if (this.levels.length < 256) {
      this.buildTree();
    }

    let proof = [];
    let leafKey = this.toBinaryString(leaf.key);

    for (let level = this.depth; level >= 1; level--) {
      let currentKey = leafKey.slice(0, level);
      let isEvenLeaf = this.isEvenLeaf(currentKey);

      let neighborLeafKey = currentKey.slice(0, -1) + (isEvenLeaf ? '1' : '0');
      let currentLevel = this.levels[level];
      let neighborLeafHash = currentLevel[neighborLeafKey];

      if (!neighborLeafHash) {
        neighborLeafHash = this.defaultHashes[this.depth - level];
      }
      if (returnBinary) {
        proof.push(new Buffer(isEvenLeaf ? [0x01] : [0x00]));
        proof.push(neighborLeafHash);
      } else {
        proof.push({ [isEvenLeaf ? 'right' : 'left']: neighborLeafHash });
      }
    }

    return proof;
  }

  checkProof(proof, leafHash, merkleRoot) {
    if (!merkleRoot || !leafHash || !proof) {
      return false;
    }
    let hash = ethUtil.toBuffer(leafHash);

    for (var level = 0; level < proof.length; level++) {
      let currentProofHash = proof[level];
      hash = currentProofHash.right ? ethUtil.sha3(Buffer.concat([ hash, currentProofHash.right ])) : ethUtil.sha3(Buffer.concat([ currentProofHash.left, hash ]));
    }
    return hash.toString('hex') == merkleRoot.toString('hex');
  }

  isEvenLeaf(leafKey) {
    return leafKey[leafKey.length - 1] == '0';
  }

  isHex (value) {
    var hexRegex = /^[0-9A-Fa-f]{2,}$/;
    return hexRegex.test(value);
  }

  toBinaryString(value) {
    let hexValue = this.toHexString(value);

    if (hexValue) {
      return this.hexToBin(hexValue);
    } else {
      throw new Error(`Unsupported format: ${value}`);
    }
  }

  toHexString(value) {
    if (value instanceof Buffer) {
      return value.toString('hex');
    } else if (this.isHex(value)) {
      return value;
    }
    return null;
  }

  hexToBin(str) {
    return str.split('').map(item => parseInt(item, 16).toString(2).padStart(4, '0')).join('');
  }

  binStrIncrement(str) {
    let done = false;
    let current = str.length - 1;
    str = str.split('');
    while (!done) {
      if (str[current] == '0') {
        str[current] = '1';
        done = true;
      } else {
        str[current--] = '0';
      }
    }
    return str.join('');
  }

  binStrDecrement(str) {
    let done = false;
    let current = str.length - 1;
    str = str.split('');
    while (!done) {
      if (str[current] == '1') {
        str[current] = '0';
        done = true;
      } else {
        str[current--] = '0';
      }
    }
    return str.join('');
  }
}

export default Merkle;
