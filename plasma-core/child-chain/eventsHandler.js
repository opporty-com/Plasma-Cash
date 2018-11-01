'use strict'
import RLP from 'rlp'

import config from 'config'
import redis from 'lib/storage/redis'
import {createDepositTransaction} from 'child-chain'
import logger from 'lib/logger'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import contractHandler from 'root-chain/contracts/plasma'

let x = 0
const depositEventHandler = async (event) => {
  const {tokens} = event.returnValues

  console.log('tokens', tokens);
  
  let owner = config.plasmaNodeAddress.substr(2)
  let deposit = RLP.encode([owner, tokenId, amount, blockNumber])
  await redis.hsetAsync(`utxo_${config.plasmaNodeAddress}`, tokenId, deposit)
  const tx = await createDepositTransaction(depositor, tokenId)
  await TxMemPool.acceptToMemoryPool(txMemPool, tx)
  logger.info(' DEPOSIT#', x++, ' ', blockNumber)
  logger.info('For temporarily, token id: ', tokenId)
}


export {
  depositEventHandler,
  makeAddStakeEvent,
  makeLowerStakeEvent,
}
