import {stateValidators} from 'consensus'
import config from 'config'

const initConsensus = async () => {
  await stateValidators.addCandidate(config.plasmaNodeAddress)
  await stateValidators.voteCandidates()
}

export {initConsensus}
