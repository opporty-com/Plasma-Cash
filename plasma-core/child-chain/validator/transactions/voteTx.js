import {
  validatePayTx,
  voteTxExecute,
} from 'child-chain/validator/transactions'


const validateVoteTx = async (transaction) => {
  await validatePayTx(transaction)
  return {success: true}
}

const validateAndExecuteVoteTx = async (transaction, blockNumber) => {
  await validatePayTx(transaction)
  await voteTxExecute(transaction, blockNumber)
  return {success: true}
}

export {validateAndExecuteVoteTx, validateVoteTx}

