'use strict'

import {parseM} from 'lib/utils'
import {stateValidators, validatorsQueue} from 'consensus'
import web3 from 'lib/web3'
import config from 'config'
import contractHandler from 'root-chain/contracts/plasma'

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
      let answer = await stateValidators.setCandidate()
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
      let answer = await stateValidators.removeCandidate()
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
      let {voter, candidate, tokenIds} = req.body
      if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect voter or candidate address'))
      }

      if (voter != config.plasmaNodeAddress) {
        res.statusCode = 403
        return res.end(JSON.stringify('Voter address must be the own address of node'))
      }

      let stake = {voter, candidate, tokenIds}
      let answer = await stateValidators.addStake(stake)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }
 
  // static async getStakes(req, res) {
  //   await parseM(req)
  //   try {
  //     let {candidate} = req.body
  //     let answer = await contractHandler.contract.methods.getStakes(candidate).call({from: config.plasmaNodeAddress})
  //     return res.end(JSON.stringify({answer}))
  //   } catch (error) {
  //     res.statusCode = 400
  //     return res.end(error.toString())
  //   }
  // }

  // static async getAllStakes(req, res) {
  //   await parseM(req)
  //   try {
  //     let stakes = {}
  //     let candidaties = await contractHandler.contract.methods
  //       .getCandidaties().call({from: config.plasmaNodeAddress})
  //     for (let i = 0; i<candidaties.length; i++) {
  //       stakes[`${candidaties[i]}`] = await contractHandler.contract.methods
  //         .getStakes(candidaties[i]).call({from: config.plasmaNodeAddress})
  //     }
  //     return res.end(JSON.stringify({stakes}))
  //   } catch (error) {
  //     res.statusCode = 400
  //     return res.end(error.toString())
  //   }
  // }

  // static async getContractCandidaties(req, res) {
  //   await parseM(req)
  //   try {
  //     // let {candidate} = req.body
  //     let answer = await contractHandler.contract.methods.getCandidaties().call({from: config.plasmaNodeAddress})
  //     // let answer = await contractHandler.contract.methods.getStakes(candidate).call({from: config.plasmaNodeAddress})
  //     return res.end(JSON.stringify({answer}))
  //   } catch (error) {
  //     res.statusCode = 400
  //     return res.end(error.toString())
  //   }
  // }

  // only voters be able to lover stake
  static async toLowerStake(req, res) {
    await parseM(req)
    try {
      let {voter, candidate, tokenIds} = req.body
      if (!web3.utils.isAddress(voter) || !web3.utils.isAddress(candidate)) {
        res.statusCode = 400
        return res.end(JSON.stringify('Incorrect voter or candidate address'))
      }
      if (!tokenIds) {
        res.statusCode = 400
        return res.end(JSON.stringify('You should give a tokenId'))
      }
      let stake = {voter, candidate, tokenIds}
      let answer = await stateValidators.toLowerStake(stake)
      return res.end(JSON.stringify({answer}))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
    }
  }
}

export default ValidatorsController
