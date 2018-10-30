'use strict'

import {parseM} from 'lib/utils'
import {stateValidators, validatorsQueue} from 'consensus'
import web3 from 'lib/web3'
import config from 'config'

/** Class representing a validation controller. */
class ValidatorsController {
  // get the list of candidates with their stakes
  static async getCandidates(req, res) {
    try {
      let answer = await stateValidators.getAllCandidates()
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 500
      return res.end(error.toString())
    }
  }

  static async getCurrentValidator(req, res) {
    try {
      await validatorsQueue.prepareValidators()
      let answer = await validatorsQueue.getCurrentValidator()
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 500
      return res.end(error.toString())
    }
  }

  // all users can become candidate
  static async proposeCandidate(req, res) {
    await parseM(req)
    try {
      let {address} = req.body
      if (!web3.utils.isAddress(address)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect address'))
      }
      let answer = await stateValidators.setCandidate(address)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  // candidate can remove self from list of candidates
  static async removeCandidate(req, res) {
    await parseM(req)
    try {
      let {address} = req.body
      if (!web3.utils.isAddress(address)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect address'))
      }
      let answer = await stateValidators.removeCandidate(address)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  // only voters be able to add stake
  static async addStake(req, res) {
    await parseM(req)

    try {
      let {voter, candidate, tokenId} = req.body
      if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect voter or candidate address'))
      }

      if (voter != config.plasmaNodeAddress) {
        res.statusCode = 403
        return res.end(JSON.stringify('Voter address must be the own address of node'))
      }

      let stake = {voter, candidate, tokenId}
      let answer = await stateValidators.addStake(stake)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }

  // only voters be able to lover stake
  static async toLowerStake(req, res) {
    await parseM(req)
    try {
      let {voter, candidate, tokenId} = req.body
      if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect voter or candidate address'))
      }
      if (!tokenId) {
        res.statusCode = 400
        return res.end(JSON.stringify('You should give a tokenId'))
      }
      let stake = {voter, candidate, tokenId}
      let answer = await stateValidators.toLowerStake(stake)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }
}

export default ValidatorsController
