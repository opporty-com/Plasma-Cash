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
  if (!checkTransactionFields(transaction)) {
    return {success: false, cause: rejectCauses.txFieldsIsInvalid}
  }
  const tokenOwner = transaction.newOwner
  const voter = await getSignatureOwner(transaction)
  if (!voter) {
    return {success: false, cause: rejectCauses.invalidSignature}
  }
  const utxos = await getUtxosForAddress(tokenOwner)
  if (utxos.length === 0) {
    return {success: false, cause: rejectCauses.undefinedUtxo}
  }
  let tokenId = transaction.tokenId.toString()
  if (!checkUtxoFieldsAndFindToken(utxos, tokenId, tokenOwner)) {
    return {success: false, cause: rejectCauses.noUtxo}
  }
  let block = {}
  const {candidate, blockNumber} = transaction.data
  if (!candidate || !blockNumber) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let blockKey = 'block' + blockNumber.toString(10)
  try {
    block = (new Block(await redis.getAsync(Buffer.from(blockKey))))
  } catch (error) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let stakeTransaction = block.getTxByTokenId(transaction.tokenId)
  if (!stakeTransaction) {
    return {answer: false, cause: rejectCauses.failData}
  }
  let stakeOwner = await web3.eth.personal.ecRecover(stakeTransaction
    .getHash(true).toString('hex'),
  ethUtil.addHexPrefix(stakeTransaction.signature.toString('hex')))
  if (stakeOwner != voter) {
    return {answer: false, cause: rejectCauses.failData}
  }
  return {success: true}
}

const validateAndExecuteUnvoteTx = async (transaction, blockNumber) => {
  let validateResponse = await validateUnvoteTx(transaction)
  if (!validateResponse.success) {
    return {success: false, cause: validateResponse.cause}
  }
  let executeResponse = await unvoteTxExecute(transaction, blockNumber)
  if (!executeResponse.success) {
    return {success: false, cause: executeResponse.cause}
  }
  return {success: true}
}

export {validateAndExecuteUnvoteTx, validateUnvoteTx}
