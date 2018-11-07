import {
  validatePayTx,
  candidateTxExecute,
} from 'child-chain/validator/transactions'


const validateCandidateTx = async (transaction) => {
  await validatePayTx(transaction)
  return {success: true}
}

const validateAndExecuteCandidateTx = async (transaction, blockNumber) => {
  await validatePayTx(transaction)
  await candidateTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteCandidateTx, validateCandidateTx}
