import {validateDefaultTx,
  validateVoteTx,
  validateUnvoteTx,
  validateAndExecuteDefaultTx,
  validateAndExecuteVoteTx,
  validateAndExecuteUnvoteTx,
} from 'child-chain/validator'

const validateAllTxs = (transactions) => {
  let successfullTransactions = []
  let rejectTransactions = []
  for (let len = 0; len<transactions.length; len++) {
    switch (transactions[len].type.toString()) {
    case 'pay': {
      let validResponse = validateDefaultTx(transactions[len])
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    case 'vote': {
      let validResponse = validateVoteTx(transactions[len])
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    case 'unvote': {
      let validResponse = validateUnvoteTx(transactions[len])
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    }
  }
  return {successfullTransactions, rejectTransactions}
}

const validateAndExecuteAllTxs = (transactions, blockNumber) => {
  let successfullTransactions = []
  let rejectTransactions = []
  for (let len = 0; len<transactions.length; len++) {
    switch (transactions[len].type.toString()) {
    case 'pay': {
      let validResponse = validateAndExecuteDefaultTx(transactions[len], blockNumber)
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    case 'vote': {
      let validResponse = validateAndExecuteVoteTx(transactions[len], blockNumber)
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    case 'unvote': {
      let validResponse = validateAndExecuteUnvoteTx(transactions[len], blockNumber)
      if (!validResponse.success) {
        rejectTransactions.push({
          transaction: transactions[len],
          cause: validResponse.cause,
        })
      } else {
        successfullTransactions.push(transactions[len])
      }
      break
    }
    }
  }
  return {successfullTransactions, rejectTransactions}
}

export {validateAllTxs, validateAndExecuteAllTxs}
