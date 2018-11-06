import {validatePayTx,
  validateVoteTx,
  validateUnvoteTx,
  validateAndExecutePayTx,
  validateAndExecuteVoteTx,
  validateAndExecuteUnvoteTx,
} from 'child-chain/validator'

const validate = {
  validatePayTx,
  validateVoteTx,
  validateUnvoteTx,
  validateAndExecutePayTx,
  validateAndExecuteVoteTx,
  validateAndExecuteUnvoteTx,
}

const validateAllTxs = (transactions, toExecute) => {
  let successfullTransactions = []
  let rejectTransactions = []
  let action = toExecute ? 'validateAndExecute' : 'validate'
  for (let transaction of transactions) {
    let typeStr = transaction.type.toString()
    let desiredFunction = action + typeStr[0].toUpperCase() + typeStr.slice(1) + 'Tx'
    try {
      validate[`${desiredFunction}`](transaction)
      successfullTransactions.push(transaction)
    } catch (cause) {
      rejectTransactions.push({
        hash: transaction.getHash,
        cause: cause.toString(),
      })
    }
  }
  return {successfullTransactions, rejectTransactions}
}

export {validateAllTxs}
