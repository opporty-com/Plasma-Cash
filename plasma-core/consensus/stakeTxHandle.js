import {stateValidators} from 'consensus'
import {redis} from 'lib/storage/redis'
import web3 from 'lib/web3'

const stakeTxHandle = (transaction, oldOwner) => {
    if (transaction.type === 'vote') {
      vote(transaction, oldOwner)
    }
    else if (transaction.type === 'unvote') {
      unvote(transaction, oldOwner)
    }
}

const vote = async (transaction, oldOwner) => {
  let value = typeof transaction.tokenId === 'string' ? 1 : transaction.tokenId.length
  stateValidators.addStake({voter: oldOwner, candidate: transaction.data, value })
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