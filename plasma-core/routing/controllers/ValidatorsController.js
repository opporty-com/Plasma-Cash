'use strict'

import {parseM} from 'lib/utils'
import {stateValidators, validatorsQueue} from 'consensus'
import web3 from 'lib/web3'
import contractHandler from 'root-chain/contracts/plasma'
import ethUtil from 'ethereumjs-util'

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
        res.end(JSON.stringify('Incorrect address'))
      }
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
      if (!web3.utils.isAddress(address)) {
        res.statusCode = 400
        res.end(JSON.stringify('Incorrect address'))
      }
      let answer = await stateValidators.removeCandidate(address)
      res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }

  // only voters be able to add stake
  static async addStake(req, res) {
    await parseM(req)
    let {voter, password, candidate, value} = req.body
    console.log(voter, password, candidate, value);
    if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
      res.statusCode = 400
      res.end(JSON.stringify('Incorrect voter or candidate address'))
    }
    try {
      if (web3.utils.isAddress(ethUtil.keccak256(voter))) {
        throw new Error('address is not defined')
      }
      console.log('[0]');
      await web3.eth.personal.unlockAccount(voter, password, 60)
      console.log('[1]');
      let gas = await contractHandler.contract.methods.deposit().estimateGas({from: voter})
      console.log('[2]');
      await contractHandler.contract.methods.addStake(candidate).send({from: voter, value, gas: gas + 15000})
      console.log('[3]');
    } catch (error) {
      return error.toString()
    }
    res.end(JSON.stringify('ok'))

    // try {
    //   let {voter, candidate, value} = req.body
    //   if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
    //     res.statusCode = 400
    //     res.end(JSON.stringify('Incorrect voter or candidate address'))
    //   }
    //   if (!(typeof value === 'number')) {
    //     res.statusCode = 400
    //     res.end(JSON.stringify('Incorrect type of value'))
    //   }
    //   let stake = {voter, candidate, value}
    //   let answer = await stateValidators.addStake(stake)
    //   res.end(JSON.stringify({answer}))
    // } catch (error) {
    //   res.statusCode = 400
    //   res.end(error.toString())
    // }
  }

  // only voters be able to lover stake
  static async toLowerStake(req, res) {
    await parseM(req)
    try {
      let {voter, candidate, value} = req.body
      if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
        res.statusCode = 400
        res.end(JSON.stringify('Incorrect voter or candidate address'))
      }
      if (!(typeof value === 'number')) {
        res.statusCode = 400
        res.end(JSON.stringify('Incorrect type of value'))
      }
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
