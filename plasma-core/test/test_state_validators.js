
import {stateValidators, Voter, validatorsQueue} from 'consensus'
import chai from 'chai'
import chai_things from 'chai-things'
chai.should()
chai.use(chai_things)
const expect = chai.expect

const aliceAddress = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b'
const peterAddress = '0xbc01Cd4A866c557623F83db195C64b0785F62d01'
const sofiyaAddress = '0xE2201Ef12c3216750513F900fea533eeEa63e7EF'
const plasmaAddress = '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70'
const bobAddress = '0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8'
const rosettaAddress = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e'
const carolAddress = '0x4CCa94A907A979f105bfsE1e0FB713ED3A478F86'
const danAddress = '0x3d90A916Af5163cAC1A0emc822D47eF224E85711'
const eveAddress = '0x4CCa94A907A979f105bfwE1e0FB713ED3A478F86'

let proposeCandidates = [
  bobAddress,
  danAddress,
  plasmaAddress,
  sofiyaAddress,
  rosettaAddress,
  eveAddress,
  carolAddress]

let aliceVoter = new Voter(aliceAddress)
let peterVoter = new Voter(peterAddress)

describe('stateValidators', async () => {
  it('should set and get candidates', async () => {
    for (let i = 0; i < proposeCandidates.length; i++) {
      await stateValidators.setCandidate(proposeCandidates[i])
    }
    let candidates = stateValidators.getAllCandidates()
    let addressesOfCandidates = candidates.map((candidate) => {
      return candidate.getAddress()
    })

    for (let i = 0; i < proposeCandidates.length; i++) {
      expect(addressesOfCandidates).to.include(proposeCandidates[i])
    }
  })

  it('correct add and check stake', () => {
    peterVoter.addStake(3, plasmaAddress)
    peterVoter.addStake(4, eveAddress)
    aliceVoter.addStake(3, plasmaAddress)
    aliceVoter.addStake(2, rosettaAddress)

    let rosettaCandidate = stateValidators.getCandidate(rosettaAddress)
    let plasmaCandidate = stateValidators.getCandidate(plasmaAddress)
    let eveCandidate = stateValidators.getCandidate(eveAddress)

    expect(rosettaCandidate.getWeight()).to.equal(2)
    expect(plasmaCandidate.getWeight()).to.equal(6)
    expect(eveCandidate.getWeight()).to.equal(4)
  })

  it('correct lower or remove stake and check it', () => {
    aliceVoter.toLowerStake(2, plasmaAddress)
    peterVoter.toLowerStake(4, eveAddress)
    
    // wrong, because peter did not add stake for rosetta,
    // thus rosetta stakes will not lower follow
    peterVoter.toLowerStake(1, rosettaAddress)
    let rosettaCandidate = stateValidators.getCandidate(rosettaAddress)
    let eveCandidate = stateValidators.getCandidate(eveAddress)
    let plasmaCandidate = stateValidators.getCandidate(plasmaAddress)

    expect(eveCandidate.getWeight()).to.equal(0)
    expect(rosettaCandidate.getWeight()).to.equal(2)
    expect(plasmaCandidate.getWeight()).to.equal(4)
  })

  it('should compute candidates', async () => {
    // recomputes candidates is performed after available 2 vote or more
    // from different voters. Also recomputes executes for every particular time
    await aliceVoter.wantToVote()
    await peterVoter.wantToVote()

    // after recompute candidates
    let validators =
      (await validatorsQueue.getAllValidators()).map((validator) => {
        return validator.address
      })

    expect(validators).to.include(plasmaAddress)
    expect(validators).to.include(rosettaAddress)
  })

  it('should remove candidate and check it', async () => {
    stateValidators.removeCandidate(sofiyaAddress)
    let candidates = stateValidators.getAllCandidates()
    let addressesOfCandidates = candidates.map((candidate) => {
      return candidate.getAddress()
    })
    expect(addressesOfCandidates).to.not.include(sofiyaAddress)
  })

  it('should remove all candidates and check it', async () => {
    stateValidators.clearCandidates()
    let candidates = stateValidators.getAllCandidates()
    expect(candidates).to.be.empty
  })

  after(() => {
    process.exit()
  })
})
