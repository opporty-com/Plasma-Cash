import {
  validatePayTx,
  voteTxExecute,
} from 'child-chain/validator/transactions'


const validateVoteTx = (transaction) => {
  let payCheck = validatePayTx(transaction)
  if (!payCheck.success) {
    return {success: false, cause: payCheck.cause}
  }
  return {success: true}
}

const validateAndExecuteVoteTx = async (transaction, blockNumber) => {
  let payCheck = validatePayTx(transaction)
  if (!payCheck.success) {
    return {success: false, cause: payCheck.cause}
  }
  let executeResponse = await voteTxExecute(transaction, blockNumber)
  if (!executeResponse.success) {
    return {success: false, cause: executeResponse.cause}
  }
  return {success: true}
}

export {validateAndExecuteVoteTx, validateVoteTx}
