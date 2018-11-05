'use strict'

import {getBlock} from 'child-chain'
import {submitBlock} from 'child-chain'
import {parseM} from 'lib/utils'
import {sign, verify} from 'lib/bls'
import web3 from 'lib/web3'
import {RightsHandler, validatorsQueue,
  initConsensus} from 'consensus'

initConsensus()
/** Class representing a Block controller. */
class BlockController {
  static async get(req, res) {
    try {
      let params = req.url.split('/')
      const blockNumber = parseInt(params[3])
      if (!blockNumber) {
        res.statusCode = 400
        return res.end('Invalid block number')
      }
      let block = await getBlock(blockNumber)
      return res.end(JSON.stringify(block.getJson()))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  static async submitBlock(req, res) {
    await parseM(req)
    let {address, block} = req.body
    if (!web3.utils.isAddress(address)) {
      res.statusCode = 400
      return res.end(JSON.stringify('Incorrect address'))
    }
    if (!block) {
      res.statusCode = 400
      return res.end(JSON.stringify('Incorrect block data'))
    }
    if (!(await RightsHandler.validateAddressForValidating(address))) {
      res.statusCode = 403
      return res.end(JSON.stringify({message: 'is not in validators queue'}))
    }
    let currentValidator = await validatorsQueue.getCurrentValidator()
    if (currentValidator.address != address) {
      res.statusCode = 409
      return res.end(JSON.stringify({message: 'wait for the validator queue'}))
    }
    let verifySignature =
      await verify(block.signature, address, block.blockHash)
    if (!verifySignature) {
      res.statusCode = 403
      return res.end(JSON.stringify({message: 'signature is not valid'}))
    }
    submitBlock(address, block.blockHash)
    await validatorsQueue.setNextValidator()
    return res.end(JSON.stringify('ok'))
  }

  static async sign(req, res) {
    await parseM(req)
    try {
      let {address, blockHash} = req.body
      if (!web3.utils.isAddress(address)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect address'))
      }
      if (!blockHash) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect block data'))
      }
      let signature = sign(address, blockHash)
      return res.end(JSON.stringify({signature}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  static async proof(req, res) {
    await parseM(req)
    try {
      let {block: blockNumber, tokenId} = req.body
      if (!blockNumber || !tokenId) {
        res.statusCode = 400
        return res.end(JSON.stringify('Wrong request body'))
      }
      let block = await getBlock(blockNumber)
      let proof = block.getProof(tokenId, true)
      return res.end(JSON.stringify({proof}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  static async checkProof(req, res) {
    await parseM(req)
    try {
      let {block: blockNumber, hash, proof} = req.body
      if (!blockNumber || !hash || !proof) {
        res.statusCode = 400
        return res.end(JSON.stringify('Wrong request body'))
      }
      let block = await getBlock(blockNumber)
      return res.end(JSON.stringify(block.checkProof(proof, hash)))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }
}

export default BlockController
