'use strict'

import {parseM} from 'lib/utils'
import {stateValidators} from 'consensus'

/** Class representing a validation controller. */
class ValidatorsController {
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
      res.end(error.toString())
    }
  }

  // get the list of candidates with their stakes
  static async getCandidates(req, res) {
    try {
      let answer = await stateValidators.getCandidates()
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
      console.log('[0]')

      let {address} = req.body
      console.log('[1]')
      let answer = await stateValidators.removeCandidate(address)
      console.log('[2]')
      res.end(JSON.stringify({answer}))
    } catch (error) {
      console.log(error)

      res.statusCode = 400
      res.end(error.toString())
    }
  }

  // only voters be able to add stake
  static async addStake(req, res) {
    console.log('request to addstake')

    await parseM(req)
    try {
      console.log('stake 1')

      let {voter, candidate, value} = req.body
      let stake = {voter, candidate, value}
      console.log('stake', stake)

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

  // only voters be able to want to compute candidates
  static async wantToComputeCandidates(req, res) {
    await parseM(req)
    try {
      let {voter} = req.body
      let answer = await stateValidators.reVote(voter)
      res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }
}

export default ValidatorsController
