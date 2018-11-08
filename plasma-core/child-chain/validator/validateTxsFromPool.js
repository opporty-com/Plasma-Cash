import {txMemPool} from 'child-chain/TxMemPool'
import {validateAllTxs} from 'child-chain/validator/transactions'

const validateTxsFromPool = async () => {
  let transactions = await txMemPool.txs()
  return await validateAllTxs(transactions, false)
}

export {validateTxsFromPool}
