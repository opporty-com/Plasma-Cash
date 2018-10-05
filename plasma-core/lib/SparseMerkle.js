'use strict'

import ethUtil from 'ethereumjs-util'
const BN = ethUtil.BN
/** Sparse Merkle tree */
class Merkle {
  constructor(leaves) {
    this.leaves = {}
    leaves.forEach((leaf) => {
      this.leaves[this.toBinaryString(leaf.key)] = ethUtil.toBuffer(leaf.hash)
    })

    this.depth = 256
    this.defaultHashes = [new Buffer(32)]

    for (let index = 0; index < this.depth - 1; index++) {
      this.defaultHashes.push(ethUtil.sha3(
        Buffer.concat([this.defaultHashes[index], this.defaultHashes[index]])))
    }
  }

  getMerkleRoot() {
    return this.levels[0] && this.levels[0].merkleRoot
  }

  buildTree() {
    if (Object.keys(this.leaves).length > 0) {
      this.levels = []
      this.levels.unshift(this.leaves)
      for (let level = 0; level < this.depth; level++) {
        let currentLevel = this.levels[0]
        let nextLevel = {}

        Object.keys(currentLevel).forEach((leafKey) => {
          let leafHash = currentLevel[leafKey]
          let isEvenLeaf = this.isEvenLeaf(leafKey)
          let parentLeafKey = leafKey.slice(0, -1)
          let neighborLeafKey = parentLeafKey + (isEvenLeaf ? '1' : '0')

          let neighborLeafHash = currentLevel[neighborLeafKey]
          if (!neighborLeafHash) {
            neighborLeafHash = this.defaultHashes[level]
          }

          if (!nextLevel[parentLeafKey]) {
            let parentLeafHash = isEvenLeaf ?
              ethUtil.sha3(Buffer.concat([leafHash, neighborLeafHash])) :
              ethUtil.sha3(Buffer.concat([neighborLeafHash, leafHash]))
            if (level == this.depth - 1) {
              nextLevel['merkleRoot'] = parentLeafHash
            } else {
              nextLevel[parentLeafKey] = parentLeafHash
            }
          }
        })

        this.levels.unshift(nextLevel)
      }
    }
  }

  getProof(tokenId, returnBinary) {
    if (!this.levels || this.levels.length < 256) {
      this.buildTree()
    }

    let proof = []
    let leafKey = this.toBinaryString(tokenId)

    for (let level = this.depth; level >= 1; level--) {
      let currentKey = leafKey.slice(0, level)
      let isEvenLeaf = this.isEvenLeaf(currentKey)

      let neighborLeafKey = currentKey.slice(0, -1) + (isEvenLeaf ? '1' : '0')
      let currentLevel = this.levels[level]
      let neighborLeafHash = currentLevel[neighborLeafKey]

      if (!neighborLeafHash) {
        neighborLeafHash = this.defaultHashes[this.depth - level]
      }

      if (returnBinary) {
        proof.push(new Buffer(isEvenLeaf ? [0x01] : [0x00]))
        proof.push(neighborLeafHash)
      } else {
        proof.push({[isEvenLeaf ? 'right' : 'left']: neighborLeafHash})
      }
    }

    return returnBinary ? Buffer.concat(proof).toString('hex') : proof
  }

  checkProof(proof, leafHash, merkleRoot) {
    if (!merkleRoot || !leafHash || !proof) {
      return false
    }
    let hash = leafHash instanceof Buffer ?
      leafHash :
      Buffer.from(leafHash, 'hex')

    if (Array.isArray(proof)) {
      for (let level = 0; level < proof.length; level++) {
        let currentProofHash = proof[level]
        hash = currentProofHash.right ?
          ethUtil.sha3(Buffer.concat([hash, currentProofHash.right])) :
          ethUtil.sha3(Buffer.concat([currentProofHash.left, hash]))
      }
    } else {
      proof = Buffer.from(proof, 'hex')
      let right = Buffer.from('01', 'hex')
      for (let start = 0, i = 33, length = proof.length; i <= length; i += 33) {
        let neighborLeafHash = proof.slice(start + 1, i)
        let typeByte = proof.slice(start, start + 1)
        let isRigthNeighbor = typeByte.equals(right)
        hash = isRigthNeighbor ?
          ethUtil.sha3(Buffer.concat([hash, neighborLeafHash])) :
          ethUtil.sha3(Buffer.concat([neighborLeafHash, hash]))
        start = i
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

  hexToBin(str) {
    return str.split('').map((item) =>
      parseInt(item, 16).toString(2).padStart(4, '0')).join('')
  }
}

export default Merkle
