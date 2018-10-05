import { txMemPool } from 'child-chain/TxMemPool';
import web3 from 'lib/web3'
import { getAllUtxos } from 'child-chain'

import ethUtil from 'ethereumjs-util';

import rejectCauses from './rejectCauses'

const validateTx = async () => {

  console.time('validateTime');

  let transactions = await txMemPool.txs()

  let successfullTransactions = []
  let rejectTransactions = []

  for (let i = 0; i < transactions.length; i++) {

    let flagOfAccept = false

    if (!transactions[i].prev_hash ||
      !(transactions[i].prev_block > -2) ||
      !transactions[i].token_id ||
      !transactions[i].new_owner ||
      !transactions[i].signature) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.txFieldsIsInvalid })
      continue
    }

    let old_owner = await web3.eth.personal.ecRecover(transactions[i].getHash(true).toString('hex'), ethUtil.addHexPrefix(transactions[i].signature.toString('hex')))

    if (!old_owner) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.invalidSignature })
      continue
    }

    let utxo = await getAllUtxos([old_owner])

    if (utxo.length === 0) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.undefinedUtxo })
      continue
    }

    for (let i = 0; i < utxo.length; i++) {

      if (!utxo[i].owner ||
        !utxo[i].token_id ||
        !utxo[i].amount ||
        !(utxo[i].block_number > -1)) {
        rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.utxoFieldsIsInvalid })
        continue
      }

      if ((utxo[i].token_id === transactions[i].token_id.toString()) && (utxo[i].owner === old_owner)) {
        flagOfAccept = true
        successfullTransactions.push(transactions[i])
      }
    }

    if (!flagOfAccept) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.noUtxo })
    }
  }

  if (successfullTransactions.length === 0) {
    return 'list of successfull transaction is empty'
  }
  
  console.time('validateTime');

  return { successfullTransactions, rejectTransactions }
}

export { validateTx }
