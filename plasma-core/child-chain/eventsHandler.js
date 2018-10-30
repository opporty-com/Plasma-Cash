'use strict'
import RLP from 'rlp'

import config from 'config'
import redis from 'lib/storage/redis'
import {createDepositTransaction} from 'child-chain'
import logger from 'lib/logger'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'

let x = 0
const depositEventHandler = async (event) => {
  const {depositor, amount, blockNumber, tokenId} = event.returnValues
  let owner = config.plasmaNodeAddress.substr(2)
  let deposit = RLP.encode([owner, tokenId, amount, blockNumber])
  await redis.hsetAsync(`utxo_${config.plasmaNodeAddress}`, tokenId, deposit)
  const tx = await createDepositTransaction(depositor, tokenId)
  await TxMemPool.acceptToMemoryPool(txMemPool, tx)
  logger.info(' DEPOSIT#', x++, ' ', blockNumber)
  console.log(tokenId);
  
}

const frozeEvent = async (event) => {
  const {tokenId, address} = event.returnValues
  await redis.hsetAsync('frozen', tokenId, address)
  return 'ok'
}

const unfrozeEvent = async (event) => {
  const {tokenId, address} = event.returnValues
  await redis.hdelAsync('frozen', tokenId, address)
  return 'ok'
}

export {depositEventHandler, frozeEvent, unfrozeEvent}
