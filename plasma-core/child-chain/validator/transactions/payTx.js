import config from 'config'

import {
  checkTransactionFields,
  getSignatureOwner,
  checkUtxoFieldsAndFindToken,
  getUtxosForAddress,
  payTxExecute,
} from 'child-chain/validator/transactions'

async function validatePayTx(transaction) {
  checkTransactionFields(transaction)
  const tokenOwner = await getSignatureOwner(transaction)
  if (tokenOwner != config.plasmaNodeAddress) {
    const utxos = await getUtxosForAddress(tokenOwner)
    let tokenId = transaction.tokenId.toString()
    checkUtxoFieldsAndFindToken(utxos, tokenId, tokenOwner)
  }
  return {success: true}
}

async function validateAndExecutePayTx(transaction, blockNumber) {
  await validatePayTx(transaction)
  await payTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecutePayTx, validatePayTx}
