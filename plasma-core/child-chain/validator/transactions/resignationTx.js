import {
  checkTransactionFields,
  resignationTxExecute,
  checkAndGetAddsHistoryTx,
} from 'child-chain/validator/transactions'

const validateResignationTx = async (transaction) => {
  checkTransactionFields(transaction)
  await checkAndGetAddsHistoryTx(transaction)
  return {success: true}
}

const validateAndExecuteResignationTx = async (transaction, blockNumber) => {
  await validateResignationTx(transaction)
  await resignationTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteResignationTx, validateResignationTx}
