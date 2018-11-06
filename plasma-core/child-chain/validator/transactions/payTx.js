import ethUtil from 'ethereumjs-util'
import {getUtxosForAddress} from 'child-chain'
import {utxoTransition} from 'child-chain/validator'
import {
  checkTransactionFields,
  getSignatureOwner,
  checkUtxoFieldsAndFindToken,
} from 'child-chain/validator/transactions'

const validatePayTx = async (transaction) => {
  checkTransactionFields(transaction)
  const tokenOwner = await getSignatureOwner(transaction)
  const utxos = await getUtxosForAddress(tokenOwner)
  let tokenId = transaction.tokenId.toString()
  checkUtxoFieldsAndFindToken(utxos, tokenId, tokenOwner)
  return {success: true}
}

const validateAndExecutePayTx = async (transaction, blockNumber) => {
  await validatePayTx(transaction)
  let dataForTransition = {
    txHash: ethUtil.addHexPrefix(transaction.getHash().toString('hex')),
    blockNumber,
    tokenId: transaction.tokenId.toString(),
    newOwner: ethUtil.bufferToHex(transaction.newOwner),
  }
  await utxoTransition(dataForTransition)
  return {success: true}
}

export {validateAndExecutePayTx, validatePayTx}
