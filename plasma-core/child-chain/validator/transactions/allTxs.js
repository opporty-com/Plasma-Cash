import logger from 'lib/logger'

import {validatePayTx, validateAndExecutePayTx} from './payTx'
import {validateVoteTx, validateAndExecuteVoteTx} from './voteTx'
import {validateUnvoteTx, validateAndExecuteUnvoteTx} from './unvoteTx'
import {validateCandidateTx, validateAndExecuteCandidateTx} from './candidateTx'
import {validateResignationTx, validateAndExecuteResignationTx} from './resignationTx'

import {
  payTxExecute,
  voteTxExecute,
  unvoteTxExecute,
  candidateTxExecute,
  resignationTxExecute,
} from './transitions'

const validate = {
  validatePayTx,
  validateVoteTx,
  validateUnvoteTx,
  validateCandidateTx,
  validateResignationTx,
  validateAndExecutePayTx,
  validateAndExecuteVoteTx,
  validateAndExecuteUnvoteTx,
  validateAndExecuteCandidateTx,
  validateAndExecuteResignationTx,
}

const execute = {
  payTxExecute,
  voteTxExecute,
  unvoteTxExecute,
  candidateTxExecute,
  resignationTxExecute,
}

const validateAllTxs = async (transactions, toExecute) => {
  let successfullTransactions = []
  let rejectTransactions = []
  let action = toExecute ? 'validateAndExecute' : 'validate'
  for (let transaction of transactions) {
    let typeStr = transaction.type.toString()
    let desiredFunction = action + typeStr[0].toUpperCase() + typeStr.slice(1) + 'Tx'
    try {
      await validate[`${desiredFunction}`](transaction)
      successfullTransactions.push(transaction)
    } catch (cause) {
      logger.error('fail validate transaction', transaction.getHash(),
        '\nError: ', cause)
      rejectTransactions.push({
        hash: transaction.getHash(),
        cause: cause.toString(),
      })
    }
  }
  return {successfullTransactions, rejectTransactions}
}

const executeAllTxs = async (transactions) => {
  let action = 'TxExecute'
  for (let transaction of transactions) {
    let desiredFunction = transaction.type.toString() + action
    try {
      await execute[`${desiredFunction}`](transaction)
    } catch (cause) {
      logger.error('fail execute transaction', transaction.getHash(),
        '\nError: ', cause)
    }
  }
  return {success: true}
}


export {validateAllTxs, executeAllTxs}
