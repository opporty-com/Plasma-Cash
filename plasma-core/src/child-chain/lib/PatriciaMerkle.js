'use strict'

import {Worker} from 'worker_threads';
import * as ethUtil from 'ethereumjs-util';
import BN from 'bn.js';


/** Mekle Patricia trie */
class Merkle {
  constructor(leaves) {
    this.leaves = []
    let existingKeys = {}
    for (let i = 0, l = leaves.length; i < l; i++) {
      let leaf = leaves[i]
      let key = this.toBinaryString(leaf.key)
      if (!existingKeys[key]) {
        existingKeys[key] = true
        this.leaves.push({key, hash: this.toBuffer(leaf.hash)})
      }
    }

  }

  getMerkleRoot() {
    const hash = this.rootNode && this.rootNode.hash;
    if (!hash)
      return null;

    return Buffer.from(hash)
  }


  runBuildNodeService(workerData) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__dirname + '/MerkleWorker.js', {workerData});
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      })
    })
  }

  async buildTree() {
    this.rootNode = await this.runBuildNodeService(this.leaves);
  }

  getProof(tokenId, returnBinary) {
    let proof = []
    let key = this.toBinaryString(tokenId)
    let node = this.rootNode

    while (key.length) {
      let nodeKey
      let itemKey
      nodeKey = node.key
      itemKey = key.slice(0, nodeKey.length)

      if (nodeKey && nodeKey != itemKey) {
        return null
      }
      if (nodeKey.length == key.length) {
        if (returnBinary) {
          proof.unshift(Buffer.from(ethUtil.keccak256(nodeKey)))
        } else {
          proof.unshift({key: ethUtil.keccak256(nodeKey)})
        }
        break
      }

      let isLeftItem = key[nodeKey.length] == '1' ? false : true
      if (isLeftItem) {
        if (returnBinary) {
          proof.unshift(node.rightChild.hash)
          proof.unshift(Buffer.from(ethUtil.keccak256(nodeKey)))
          proof.unshift(Buffer.from([0x01]))
        } else {
          proof.unshift({
            right: node.rightChild.hash,
            key: ethUtil.keccak256(nodeKey)
          })
        }
        node = node.leftChild
        key = key.slice(nodeKey.length)
      } else {
        if (returnBinary) {
          proof.unshift(node.leftChild.hash)
          proof.unshift(Buffer.from(ethUtil.keccak256(nodeKey)))
          proof.unshift(Buffer.from([0x00]))
        } else {
          proof.unshift({left: node.leftChild.hash, key: ethUtil.keccak256(nodeKey)})
        }
        node = node.rightChild
        key = key.slice(nodeKey.length)
      }
    }

    return returnBinary ? Buffer.concat(proof).toString('hex') : proof
  }

  // checkProof(proof, leafHash, merkleRoot) {
  checkProof(proof, leafHash) {

    const merkleRoot = this.rootNode.hash;

    if (!merkleRoot || !leafHash || !proof) {
      return false
    }
    let hash = leafHash instanceof Buffer ?
      leafHash :
      Buffer.from(leafHash, 'hex')

    if (Array.isArray(proof)) {
      proof.forEach((node, index) => {
        let nodeHashes
        if (node.right || node.left) {
          nodeHashes = node.right ?
            Buffer.concat([Buffer.from(node.key), hash, node.right]) :
            Buffer.concat([Buffer.from(node.key), node.left, hash])
        } else {
          nodeHashes = Buffer.concat([Buffer.from(node.key), hash])
        }
        hash = ethUtil.keccak256(nodeHashes)
      })
    } else {
      proof = Buffer.from(proof, 'hex')
      let right = Buffer.from('01', 'hex')
      let keyLeafHash = proof.slice(0, 32)
      hash = ethUtil.keccak256(Buffer.concat([keyLeafHash, hash]))

      for (let i = 32, length = proof.length; i < length; i += 65) {
        let typeByte = proof.slice(i, i + 1)
        let keyLeafHash = proof.slice(i + 1, i + 33)
        let neighborLeafHash = proof.slice(i + 33, i + 65)
        let isRigthNeighbor = typeByte.equals(right)
        hash = isRigthNeighbor ?
          ethUtil.keccak256(Buffer.concat([keyLeafHash, hash, neighborLeafHash])) :
          ethUtil.keccak256(Buffer.concat([keyLeafHash, neighborLeafHash, hash]))
      }
    }

    return hash.toString('hex') == merkleRoot.toString('hex')
  }

  isEvenLeaf(leafKey) {
    return leafKey[leafKey.length - 1] == '0'
  }

  isHex(value) {
    let hexRegex = /^[0-9A-Fa-f]{2,}$/
    return hexRegex.test(value)
  }

  toBinaryString_(value) {
    let hexValue = this.toHexString(value)

    if (hexValue) {
      return this.hexToBin(hexValue)
    } else {
      throw new Error(`Unsupported format: ${value}`)
    }
  }

  toBinaryString(value) {
    if (value instanceof Buffer) {
      value = value.toString()
    }
    return new BN(value, 10).toString(2).padStart(256, '0')
  }

  toHexString(value) {
    if (value instanceof Buffer) {
      return value.toString('hex')
    } else if (this.isHex(value)) {
      return value
    }

    return null
  }

  toBuffer(value) {
    if (value instanceof Buffer) {
      return value
    }
    return Buffer.from(value, 'hex')
  }

  hexToBin(str) {
    return str.split('').map((item) =>
      parseInt(item, 16).toString(2).padStart(4, '0')).join('')
  }
}

export default Merkle
