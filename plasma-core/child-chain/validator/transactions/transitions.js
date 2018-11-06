import redis from 'lib/storage/redis'
import RLP from 'rlp'
import rejectCauses from 'child-chain/validator/rejectCauses'
import {stateValidators} from 'consensus'
import ethUtil from 'ethereumjs-util'
import {getSignatureOwner} from 'child-chain/validator/transactions'

const voteTxExecute = async (transaction, blockNumber) => {
  const tokenOwner = await getSignatureOwner(transaction)
  let stake = {
    voter: tokenOwner,
    candidate: transaction.data.candidate.toString(),
    value: 1,
  }
  await stateValidators.addStake(stake)
  let dataForTransition = {
    txHash: ethUtil.addHexPrefix(transaction.getHash().toString('hex')),
    blockNumber,
    tokenId: transaction.tokenId.toString(),
    newOwner: ethUtil.bufferToHex(transaction.newOwner),
  }
  await utxoTransition(dataForTransition)
  return {success: true}
}

const unvoteTxExecute = async (transaction, blockNumber) => {
  const stakeOwner = await getSignatureOwner(transaction)
  let stake = {
    voter: stakeOwner,
    candidate: transaction.data.toString().candidate,
    value: 1,
  }
  await stateValidators.toLowerStake(stake)
  let dataForTransition = {
    txHash: ethUtil.addHexPrefix(transaction.getHash().toString('hex')),
    blockNumber,
    tokenId: transaction.tokenId.toString(),
    newOwner: stakeOwner,
  }
  await utxoTransition(dataForTransition)
  return {success: true}
}

const utxoTransition = async (dataForTransition) => {
  const {txHash, blockNumber, tokenId, newOwner} = dataForTransition
  let newTokenHistory = {
    prevHash: txHash,
    prevBlock: blockNumber,
  }
  let utxo = [
    newOwner.substr(2),
    tokenId,
    1,
    blockNumber,
  ]
  try {
    await redis.hsetAsync(`utxo_${newOwner}`, tokenId, RLP.encode(utxo))
    await redis.hsetAsync('history', tokenId, JSON.stringify(newTokenHistory))
  } catch (error) {
    throw new Error(rejectCauses.databaseError)
  }
  return {success: true}
}

export {
  utxoTransition,
  voteTxExecute,
  unvoteTxExecute,
}
