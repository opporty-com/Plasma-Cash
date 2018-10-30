import {stateValidators} from 'consensus'
import config from 'config'

const initConsensus = async () => {
  await stateValidators.setCandidate(config.plasmaNodeAddress)
  await stateValidators.voteCandidates()
}

export {initConsensus}
