'use strict'

import {parseM} from 'lib/utils'
import {stateValidators, validatorsQueue} from 'consensus'

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
      let answer = await stateValidators.setCandidate(address)
      res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }

  // candidate can remove self from list of candidates
  static async removeCandidate(req, res) {
    await parseM(req)
    try {

      let {address} = req.body
      let answer = await stateValidators.removeCandidate(address)
      res.end(JSON.stringify({answer}))

    } catch (error) {
      console.log(error)

      res.statusCode = 400
      res.end(error.toString())
    }
  }

  // only voters be able to add stake
  static async addStake(req, res) {

    await parseM(req)
    try {

      let {voter, candidate, value} = req.body
      let stake = {voter, candidate, value}

      let answer = await stateValidators.addStake(stake)
      res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }

  // only voters be able to lover stake
  static async toLowerStake(req, res) {
    await parseM(req)
    try {
      let {voter, candidate, value} = req.body
      let stake = {voter, candidate, value}
      let answer = await stateValidators.toLowerStake(stake)
      res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }
}

export default ValidatorsController
