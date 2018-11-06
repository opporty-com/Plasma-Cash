
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

    if (!transactions[i].prevHash ||
      !(transactions[i].prevBlock > -2) ||
      !transactions[i].tokenId ||
      !transactions[i].newOwner ||
      !transactions[i].signature) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.txFieldsIsInvalid })
      continue
    }

    let oldOwner = await signTxVerify(transactions[i].getHash(true).toString('hex'), ethUtil.addHexPrefix(transactions[i].signature.toString('hex')))

    if (!oldOwner) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.invalidSignature })
      continue
    }

    let utxo = await getUtxoForAddresses([oldOwner])

    if (utxo.length === 0) {
      rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.undefinedUtxo })
      continue
    }

    for (let i = 0; i < utxo.length; i++) {

      if (!utxo[i].owner ||
        !utxo[i].tokenId ||
        !utxo[i].amount ||
        !(utxo[i].blockNumber > -1)) {
        rejectTransactions.push({ transaction: transactions[i].getHash(), cause: rejectCauses.utxoFieldsIsInvalid })
        continue
      }

      if ((utxo[i].tokenId === transactions[i].tokenId.toString()) && (utxo[i].owner === oldOwner)) {
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

  let blockHash = ethUtil.bufferToHex(block.getRlp()).substr(2)

  let { signature } = await signBlock(address, blockHash)

  let blockData = {
    signature, blockHash
  }

  let answer = await submitBlock(address, blockData, rejectTransactions)
  console.timeEnd('validateTime');

  return answer
}

export { validateBlock }
