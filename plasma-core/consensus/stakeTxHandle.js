import {stateValidators} from 'consensus'
import {redis} from 'lib/storage/redis'
import web3 from 'lib/web3'

const stakeTxHandle = async (transaction, oldOwner) => {

    if (transaction.type.toString('utf8') === 'vote') {    
      return await vote(transaction.getJson(), oldOwner)
    }
    else if (transaction.type.toString('utf8') === 'unvote') {
      return await unvote(transaction.getJson(), oldOwner)
    }
  }
  const vote = async (transaction, oldOwner) => {
    let value = typeof transaction.tokenId === 'string' ? 1 : transaction.tokenId.length
    let stake = {voter: oldOwner, candidate: transaction.data.candidate, value }
    await stateValidators.addStake(stake)
  return {answer: true}
}

const unvote = async (transaction, oldOwner) => {

  const {candidate} = transaction.data
  let value = typeof transaction.tokenId === 'string' ? 1 : transaction.tokenId.length  
  let blockKey = 'block' + transaction.data.blockNumber.toString(10)
  let block = (new Block(await redis.getAsync(Buffer.from(blockKey)))).toJson()
  let tx = block.getTxByTokenId(tokenId)
  if(!tx){
    return {answer: false, cause: 'Fail of data field for unvote transaction'}
  }
  let stakeOwner = await web3.eth.personal.ecRecover(tx
    .getHash(true).toString('hex'),
  ethUtil.addHexPrefix(tx.signature.toString('hex')))
  if(stakeOwner != oldOwner){
    return {answer: false, cause: 'Fail of data field for unvote transaction'}
  }
  stateValidators.toLowerStake({voter: oldOwner, candidate, value })
  return {answer: true}
}

export {stakeTxHandle}