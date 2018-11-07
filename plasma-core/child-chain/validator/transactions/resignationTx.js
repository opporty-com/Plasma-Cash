import ethUtil from 'ethereumjs-util'
import Block from 'child-chain/block'
import web3 from 'lib/web3'
import redis from 'lib/storage/redis'

import rejectCauses from 'child-chain/validator/rejectCauses'
import {
  checkTransactionFields,
  getSignatureOwner,
  getUtxosForAddress,
  resignationTxExecute,
  checkUtxoFieldsAndFindToken,
} from 'child-chain/validator/transactions'

const validateResignationTx = async (transaction) => {
  const {blockNumber} = transaction.data
  if (!blockNumber) {
    throw new Error(rejectCauses.failData)
  }
  checkTransactionFields(transaction)
  const tokenOwner = transaction.newOwner
  const resignationCandidate = await getSignatureOwner(transaction)
  const utxos = await getUtxosForAddress(tokenOwner)
  let tokenId = transaction.tokenId.toString()
  checkUtxoFieldsAndFindToken(utxos, tokenId, tokenOwner)
  let blockKey = 'block' + blockNumber.toString(10)
  let block = (new Block(await redis.getAsync(Buffer.from(blockKey))))
  if (!block) {
    throw new Error(rejectCauses.failData)
  }
  let candidateTransaction = block.getTxByTokenId(transaction.tokenId)
  if (!candidateTransaction) {
    throw new Error(rejectCauses.failData)
  }
  let candidate = await getSignatureOwner(candidateTransaction)
  if (candidate != resignationCandidate) {
    throw new Error(rejectCauses.failData)
  }
  return {success: true}
}

const validateAndExecuteResignationTx = async (transaction, blockNumber) => {
  await validateResignationTx(transaction)
  await resignationTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteResignationTx, validateResignationTx}
