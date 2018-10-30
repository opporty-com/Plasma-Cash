import web3 from 'lib/web3'
import redis from 'lib/storage/redis'
import {frozeEvent, unfrozeEvent} from 'child-chain/eventsHandler'
import config from 'config'


const frozeCoin = async (tokenId) => {
  let gas = await web3.contract.methods
    .frozenCoin(tokenId).estimateGas({from: config.plasmaNodeAddress})
  let answer = await web3.contract.methods
    .frozenCoin(tokenId).send({from: config.plasmaNodeAddress, gas})
  let stake = await frozeEvent(answer.events)
  return stake
}

const checkAllowanceForCoin = async (tokenId) => {
  let result = await redis.hgetAsync('frozen', tokenId)
  return (!!result)
}

const unfrozeCoin = async (tokenId) => {
  let gas = await web3.contract.methods
    .unfrozenCoin(tokenId).estimateGas({from: config.plasmaNodeAddress})
  let answer = await web3.contract.methods
    .unfrozenCoin(tokenId).send({from: config.plasmaNodeAddress, gas})
  let stake = await unfrozeEvent(answer.events)
  return stake
}

export {frozeCoin, checkAllowanceForCoin, unfrozeCoin}


