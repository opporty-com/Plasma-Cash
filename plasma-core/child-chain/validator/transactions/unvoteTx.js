import ethUtil from 'ethereumjs-util'
import Block from 'child-chain/block'
import web3 from 'lib/web3'
import redis from 'lib/storage/redis'

import rejectCauses from 'child-chain/validator/rejectCauses'
import {
  checkTransactionFields,
  getSignatureOwner,
  getUtxosForAddress,
  unvoteTxExecute,
  checkUtxoFieldsAndFindToken,
} from 'child-chain/validator/transactions'

const validateUnvoteTx = async (transaction) => {
  const {candidate, blockNumber} = transaction.data
  if (!candidate || !blockNumber) {
    throw new Error(rejectCauses.failData)
  }
  checkTransactionFields(transaction)
  const tokenOwner = transaction.newOwner
  const voter = await getSignatureOwner(transaction)
  const utxos = await getUtxosForAddress(tokenOwner)
  let tokenId = transaction.tokenId.toString()
  checkUtxoFieldsAndFindToken(utxos, tokenId, tokenOwner)
  let blockKey = 'block' + blockNumber.toString(10)
  let block = (new Block(await redis.getAsync(Buffer.from(blockKey))))
  if (!block) {
    throw new Error(rejectCauses.failData)
  }
  let stakeTransaction = block.getTxByTokenId(transaction.tokenId)
  if (!stakeTransaction) {
    throw new Error(rejectCauses.failData)
  }
  let stakeOwner = await web3.eth.personal.ecRecover(stakeTransaction
    .getHash(true).toString('hex'),
  ethUtil.addHexPrefix(stakeTransaction.signature.toString('hex')))
  if (stakeOwner != voter) {
    throw new Error(rejectCauses.failData)
  }
  return {success: true}
}

const validateAndExecuteUnvoteTx = async (transaction, blockNumber) => {
  await validateUnvoteTx(transaction)
  await unvoteTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteUnvoteTx, validateUnvoteTx}
