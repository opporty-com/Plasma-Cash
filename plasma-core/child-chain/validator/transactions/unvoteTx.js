import rejectCauses from 'child-chain/validator/rejectCauses'
import {
  checkTransactionFields,
  unvoteTxExecute,
  checkAndGetAddsHistoryTx,
} from 'child-chain/validator/transactions'

const validateUnvoteTx = async (transaction) => {
  checkTransactionFields(transaction)
  let addsTransaction = await checkAndGetAddsHistoryTx(transaction)
  if (JSON.parse(addsTransaction.data.toString()).candidate
    != JSON.parse(transaction.data.toString()).candidate) {
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
