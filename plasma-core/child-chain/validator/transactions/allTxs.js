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

const validateAllTxs = (transactions) => {
  let successfullTransactions = []
  let rejectTransactions = []
  for (let transaction of transactions) {
    let typeStr = transaction.type.toString()
    let funcType = typeStr[0].toUpperCase() + typeStr.slice(1)
    let validResponse = validate[`validate${funcType}Tx`](transaction)
    if (!validResponse.success) {
      rejectTransactions.push({
        transaction: transaction.getHash,
        cause: validResponse.cause,
      })
    } else {
      successfullTransactions.push(transaction)
    }
  }
  return {successfullTransactions, rejectTransactions}
}

const validateAndExecuteAllTxs = (transactions, blockNumber) => {
  let successfullTransactions = []
  let rejectTransactions = []
  for (let transaction of transactions) {
    let typeStr = transaction.type.toString()
    let funcType = typeStr[0].toUpperCase() + typeStr.slice(1)
    let validResponse = validate[`validateAndExecute${funcType}Tx`](transaction, blockNumber)
    if (!validResponse.success) {
      rejectTransactions.push({
        transaction: transaction.getHash,
        cause: validResponse.cause,
      })
    } else {
      successfullTransactions.push(transaction)
    }
  }
  return {successfullTransactions, rejectTransactions}
}

export {validateAllTxs, validateAndExecuteAllTxs}
