import {
  validateDefaultTx,
  voteTxExecute,
} from 'child-chain/validator/transactions'


const validateVoteTx = async (transaction) => {
  let defaultCheck = validateDefaultTx(transaction)
  if (!defaultCheck.success) {
    return {success: false, cause: defaultCheck.cause}
  }
  return {success: true}
}

const validateAndExecuteVoteTx = async (transaction, blockNumber) => {
  let defaultCheck = validateDefaultTx(transaction)
  if (!defaultCheck.success) {
    return {success: false, cause: defaultCheck.cause}
  }
  let executeResponse = await voteTxExecute(transaction, blockNumber)
  if (!executeResponse.success) {
    return {success: false, cause: executeResponse.cause}
  }
  return {success: true}
}

export {validateAndExecuteVoteTx, validateVoteTx}
