import ethUtil from 'ethereumjs-util'
import rejectCauses from 'child-chain/validator/rejectCauses'
import {
  checkTransactionFields,
  unvoteTxExecute,
  checkAndGetAddsHistoryTx,
} from 'child-chain/validator/transactions'

const validateUnvoteTx = async (transaction) => {
  checkTransactionFields(transaction)
  let addsTransaction = await checkAndGetAddsHistoryTx(transaction)
  if (ethUtil.addHexPrefix(addsTransaction.newOwner.toString('hex'))
    != ethUtil.addHexPrefix(transaction.newOwner.toString('hex'))) {
    throw new Error(rejectCauses.failHistory)
  }
  return {success: true}
}

const validateAndExecuteUnvoteTx = async (transaction, blockNumber) => {
  await validateUnvoteTx(transaction)
  await unvoteTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteUnvoteTx, validateUnvoteTx}
