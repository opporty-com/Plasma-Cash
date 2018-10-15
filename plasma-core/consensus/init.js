import {stateValidators, Voter, validatorsQueue} from 'consensus'

const aliceAddress = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b'
const peterAddress = '0xbc01Cd4A866c557623F83db195C64b0785F62d01'
const plasmaAddress = '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70'
const bobAddress = '0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8'
const rosettaAddress = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e'
// const carolAddress = '0x4CCa94A907A979f105bfsE1e0FB713ED3A478F86'
// const danAddress = '0x3d90A916Af5163cAC1A0emc822D47eF224E85711'
// const eveAddress = '0x2AdC318Ac93A7289f83AarF26513bC0d15f0Ab3e'
// const sofiyaAddress = '0xE2201Ef12c3216750513F900fea533eeEa63e7EF'

// (async () =>{

// })()
// validatorsQueue.getAllvalidators();
// stateValidators.getCandidates();
// console.log('ALL validatorS IN QUEUE',);

// console.log('ALL CANDIDATES IN STATE', stateValidators.getCandidates());

const initConsensus = async () => {
  let aliceVoter = new Voter(aliceAddress)
  let peterVoter = new Voter(peterAddress)
  // stateValidators.setCandidate(bobAddress)
  stateValidators.setCandidate(plasmaAddress)
  // stateValidators.setCandidate(sofiyaAddress)
  // stateValidators.setCandidate(rosettaAddress)
  // stateValidators.setCandidate(carolAddress)
  // stateValidators.setCandidate(eveAddress)
  // stateValidators.setCandidate(danAddress)

  await peterVoter.addStake(5, plasmaAddress)
  await aliceVoter.addStake(2, rosettaAddress)
  await peterVoter.addStake(3, bobAddress)

  await stateValidators.voteCandidates()

  // console.log('vote candidates',await stateValidators.voteCandidates())
  // console.log('getAll validators', await validatorsQueue.getAllvalidators());
  // alice_voter.addStake(6, vova_address);
  // alice_voter.wantToVote()
  // peter_voter.wantToVote()
//   setTimeout(async ()=>{
//     // console.log('getAll validators 2',
// await validatorsQueue.getAllvalidators());
//     // console.log('getCurrentvalidator',
// await validatorsQueue.getCurrentvalidator());
//     await validatorsQueue.setNextValidator()
//     // console.log('getCurrentvalidator',
// await validatorsQueue.getCurrentvalidator());
//   }, 500)
}

// setTimeout(()=>{
//   console.log('del all validators');
//   validatorsQueue.delAllValidators()

// }, 5000)

export {initConsensus}
