
import Block from 'models/block'
import PlasmaTransaction from 'models/transaction'

import ethUtil from 'ethereumjs-util';

import rejectCauses from './rejectCauses'
import {
  signTxVerify,
  getAllTxFromPool,
  getUtxoForAddresses,
  submitBlock,
  signBlock
}
  from '../requests'

const validateBlock = async (address) => {

  console.time('validateTime');

  let transactions = (await getAllTxFromPool()).map(tx => {
    return new PlasmaTransaction(tx)
  })

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

    let old_owner = await signTxVerify(transactions[i].getHash(true).toString('hex'), ethUtil.addHexPrefix(transactions[i].signature.toString('hex')))

    if (!old_owner) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.invalidSignature })
      continue
    }

    let utxo = await getUtxoForAddresses([old_owner])

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
    return 'Block is empty'
  }

  let block = new Block()

  block.transactions = successfullTransactions

  block.buildTree()

  let block_hash = ethUtil.bufferToHex(block.getRlp()).substr(2)

  let { signature } = await signBlock(address, block_hash)

  let blockData = {
    signature, block_hash
  }

  let answer = await submitBlock(address, blockData, rejectTransactions)
  console.timeEnd('validateTime');

  return answer
}

export { validateBlock }
