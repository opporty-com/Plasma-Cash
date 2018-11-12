'use strict'
import RLP from 'rlp'

import config from 'config'
import redis from 'lib/storage/redis'
import {createDepositTransaction} from 'child-chain'
import logger from 'lib/logger'
import contractHandler from 'root-chain/contracts/plasma'

let x = 0
const depositEventHandler = async (event) => {
  const {depositor, amount, blockNumber, tokenId} = event.returnValues
  let owner = config.plasmaNodeAddress.substr(2)
  let deposit = RLP.encode([owner, tokenId, amount, blockNumber])
  await redis.hsetAsync(`utxo_${config.plasmaNodeAddress}`, tokenId, deposit)
  await createDepositTransaction(depositor, tokenId)
  logger.info(' DEPOSIT#', x++, ' ', blockNumber)
  logger.info('For temporarily, token id: ', tokenId)
  return tokenId
}

async function makeAddStakeEvent({voter, candidate, tokenId}) {
  try {
    if (!(await redis.hgetAsync(`utxo_${voter}`, tokenId))) {
      throw new Error('Forbidden token')
    }
    if (await redis.hgetAsync('frozen', tokenId)) {
      throw new Error('This token is already frozen')
    }
    let gas = await contractHandler.contract.methods
      .addStake(candidate, tokenId)
      .estimateGas({from: voter})
    let answer = await contractHandler.contract.methods
      .addStake(candidate, tokenId)
      .send({from: voter, gas: gas + 15000})
    let returnValues = answer.events.StakeAdded.returnValues
    await redis.hsetAsync('frozen', tokenId, voter)
    let stake = {
      voter: returnValues.voter,
      candidate: returnValues.candidate,
      value: +returnValues.value,
    }
    return stake
  } catch (error) {
    throw error
  }
}

async function makeLowerStakeEvent({voter, candidate, tokenId}) {
  try {
    if (!(await redis.hgetAsync(`utxo_${voter}`, tokenId))) {
      throw new Error('Forbidden token')
    }
    let gas = await contractHandler.contract.methods
      .lowerStake(candidate, tokenId)
      .estimateGas({from: voter})
    let answer = await contractHandler.contract.methods
      .lowerStake(candidate, tokenId)
      .send({from: voter, gas: gas + 15000})
    let returnValues = answer.events.StakeLowered.returnValues
    await redis.hdelAsync('frozen', returnValues.tokenId)
    let stake = {
      voter: returnValues.voter,
      candidate: returnValues.candidate,
      value: +returnValues.value,
    }
    return stake
  } catch (error) {
    throw error
  }
}

export {
  depositEventHandler,
  makeAddStakeEvent,
  makeLowerStakeEvent,
}
