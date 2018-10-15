'use strict'
import RLP from 'rlp'

import config from 'config'
import redis from 'lib/storage/redis'
import {createDepositTransaction} from 'child-chain'
import {logger} from 'lib/logger'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'

let x = 0
async function depositEventHandler(event) {
  
  const {depositor, amount, blockNumber, tokenId} = event.returnValues

  let owner = config.plasmaNodeAddress.substr(2)

  let deposit = RLP.encode([owner, tokenId, amount, blockNumber])

  await redis.hsetAsync(`utxo_${config.plasmaNodeAddress}`, tokenId, deposit)

  // const depositBlockIndexKey = 'tokenId' + blockNumber

  // const existingdepositBlockIndex = await redis.getAsync(depositBlockIndexKey)

  // if (!existingdepositBlockIndex) {
  //   await redis.setAsync(depositBlockIndexKey, 1)
  // }

  const tx = await createDepositTransaction(depositor, tokenId)

  await TxMemPool.acceptToMemoryPool(txMemPool, tx)
  logger.info(' DEPOSIT#', x++, ' ', blockNumber)
}

export {depositEventHandler}
