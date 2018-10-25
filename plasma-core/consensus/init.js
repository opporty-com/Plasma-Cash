import {stateValidators} from 'consensus'

const plasmaAddress = '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70'

const initConsensus = async () => {
  await stateValidators.setCandidate(plasmaAddress)
  await stateValidators.voteCandidates()
}

export {initConsensus}
