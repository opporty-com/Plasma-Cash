import rejectCauses from 'child-chain/validator/rejectCauses'
import ethUtil from 'ethereumjs-util'
import {getUtxosForAddress} from 'child-chain'
import {utxoTransition} from 'child-chain/validator'
import {
  checkTransactionFields,
  getSignatureOwner,
  checkUtxoFieldsAndFindToken,
} from 'child-chain/validator/transactions'

const validatePayTx = async (transaction) => {
  if (!checkTransactionFields(transaction)) {
    return {success: false, cause: rejectCauses.txFieldsIsInvalid}
  }
  const tokenOwner = await getSignatureOwner(transaction)
  if (!tokenOwner) {
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
  return {success: true}
}

const validateAndExecutePayTx = async (transaction, blockNumber) => {
  let validateResponse = await validatePayTx(transaction)
  if (!validateResponse.success) {
    return {success: false, cause: validateResponse.cause}
  }
  let dataForTransition = {
    txHash: ethUtil.addHexPrefix(transaction.getHash().toString('hex')),
    blockNumber,
    tokenId: transaction.tokenId.toString(),
    newOwner: ethUtil.bufferToHex(transaction.newOwner),
  }
  let utxoTransitionResponse = utxoTransition(dataForTransition)
  if (!utxoTransitionResponse.success) {
    return {success: false, cause: utxoTransitionResponse.cause}
  }
  return {success: true}
}

export {validateAndExecutePayTx, validatePayTx}
