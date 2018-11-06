import web3 from 'lib/web3'
import ethUtil from 'ethereumjs-util'

const checkTransactionFields = (transaction) => {
  if (!transaction.prevHash ||
    !(transaction.prevBlock > -2) ||
    !transaction.tokenId ||
    !transaction.newOwner ||
    !transaction.signature) {
    return true
  }
  return false
}

const checkUtxoFieldsAndFindToken = (utxos, tokenId, tokenOwner) => {
  for (let i = 0; i < utxos.length; i++) {
    if (!utxos[i].owner ||
      !utxos[i].tokenId ||
      !utxos[i].amount ||
      !(utxos[i].blockNumber > -1)) {
      continue
    }
    if ((utxos[i].tokenId === tokenId) &&
      (utxos[i].owner === tokenOwner)) {
      return true
    }
  }
  return false
}

const getSignatureOwner = async (transaction) => {
  let tokenOwner = await web3.eth.personal.ecRecover(transaction
    .getHash(true).toString('hex'),
  ethUtil.addHexPrefix(transaction.signature.toString('hex')))
  return tokenOwner
}

export {getSignatureOwner, checkUtxoFieldsAndFindToken, checkTransactionFields}