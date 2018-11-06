import {stateValidators} from 'consensus'
import web3 from 'lib/web3'
import rejectCauses from 'child-chain/validator/rejectCauses'
import redis from 'lib/storage/redis'
import Block from 'child-chain/block'
import ethUtil from 'ethereumjs-util'
import logger from 'lob/logger'

const stakeTxHandle = async (transaction, oldOwner) => {
  if (transaction.type.toString('utf8') === 'vote') {
    return await vote(transaction.getJson(), oldOwner)
  } else if (transaction.type.toString('utf8') === 'unvote') {
    return await unvote(transaction.getJson(), oldOwner)
  }
}
const vote = async (transaction, oldOwner) => {
  let value = typeof transaction.tokenId === 'string'
    ? 1 : transaction.tokenId.length
  let stake = {voter: oldOwner, candidate: transaction.data.candidate, value}
  await stateValidators.addStake(stake)
  return {answer: true}
}

const unvote = async (transaction, oldOwner) => {
  let block = {}
  const {candidate, blockNumber} = transaction.data
  if (!candidate, !blockNumber) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let value = typeof transaction.tokenId === 'string'
    ? 1 : transaction.tokenId.length
  let blockKey = 'block' + blockNumber.toString(10)
  try {
    block = (new Block(await redis.getAsync(Buffer.from(blockKey))))
  } catch (error) {
    logger.error(error.toString())
    return {answer: false, cause: rejectCauses.failData}
  }
  let tx = block.getTxByTokenId(transaction.tokenId)
  if (!tx) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let stakeOwner = await web3.eth.personal.ecRecover(tx
    .getHash(true).toString('hex'),
  ethUtil.addHexPrefix(tx.signature.toString('hex')))
  if (stakeOwner != oldOwner) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let stake = {voter: oldOwner, candidate, value}
  stateValidators.toLowerStake(stake)
  return {answer: true}
}

export {stakeTxHandle}
