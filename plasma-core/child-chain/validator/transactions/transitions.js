import redis from 'lib/storage/redis'
import RLP from 'rlp'
import {stateValidators} from 'consensus'
import ethUtil from 'ethereumjs-util'
import {getSignatureOwner} from 'child-chain/validator/transactions'

const utxoTransition = async ({transaction, blockNumber, newOwner, oldOwner}) => {
  let newTokenHistory = {
    prevHash: ethUtil.addHexPrefix(transaction.getHash().toString('hex')),
    prevBlock: blockNumber,
  }
  let tokenId = transaction.tokenId.toString()
  if (oldOwner) {
    await redis.hsetAsync('history', tokenId, JSON.stringify(newTokenHistory))
  }
  await redis.hdelAsync(`utxo_${oldOwner}`, tokenId)
  if (newOwner) {
    let utxo = [
      newOwner.substr(2),
      tokenId,
      1,
      blockNumber,
    ]
    await redis.hsetAsync(`utxo_${newOwner}`, tokenId, RLP.encode(utxo))
  }
  return {success: true}
}

const payTxExecute = async (transaction, blockNumber) => {
  let newOwner = ethUtil.addHexPrefix(transaction.newOwner.toString('hex'))
  let oldOwner = await getSignatureOwner(transaction)
  await utxoTransition({transaction, blockNumber, newOwner, oldOwner})
  return {success: true}
}

const voteTxExecute = async (transaction, blockNumber) => {
  let oldOwner = await getSignatureOwner(transaction)
  let stake = {
    voter: oldOwner,
    candidate: ethUtil.addHexPrefix(transaction.newOwner.toString('hex')),
    value: 1,
  }
  await stateValidators.addStake(stake)
  await utxoTransition({transaction, blockNumber, oldOwner})
  return {success: true}
}

const unvoteTxExecute = async (transaction, blockNumber) => {
  const newOwner = await getSignatureOwner(transaction)
  let stake = {
    voter: newOwner,
    candidate: ethUtil.addHexPrefix(transaction.newOwner.toString('hex')),
    value: 1,
  }
  await stateValidators.toLowerStake(stake)
  await utxoTransition({transaction, blockNumber, newOwner})
  return {success: true}
}

const candidateTxExecute = async (transaction, blockNumber) => {
  const oldOwner = await getSignatureOwner(transaction)
  await stateValidators.addCandidate(oldOwner)
  await utxoTransition({transaction, blockNumber, oldOwner})
  return {success: true}
}

const resignationTxExecute = async (transaction, blockNumber) => {
  const newOwner = await getSignatureOwner(transaction)
  await stateValidators.removeCandidate(newOwner)
  await utxoTransition({transaction, blockNumber, newOwner})
  return {success: true}
}

export {
  payTxExecute,
  voteTxExecute,
  unvoteTxExecute,
  candidateTxExecute,
  resignationTxExecute,
}
