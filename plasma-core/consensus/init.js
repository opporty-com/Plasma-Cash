import { stateValidators, Voter, validatorsQueue  } from 'consensus'

const alice_address = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b',
  peter_address = '0xbc01Cd4A866c557623F83db195C64b0785F62d01',
  sofiya_address = '0xE2201Ef12c3216750513F900fea533eeEa63e7EF',
  plasma_address = '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  bob_address = '0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8',
  rosetta_address = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e',

  carol_address = '0x4CCa94A907A979f105bfsE1e0FB713ED3A478F86',
  dan_address = '0x3d90A916Af5163cAC1A0emc822D47eF224E85711',
  eve_address = '0x2AdC318Ac93A7289f83AarF26513bC0d15f0Ab3e'

// (async () =>{

// })()
// validatorsQueue.getAllvalidators();
// stateValidators.getCandidates();
// console.log('ALL validatorS IN QUEUE',);

// console.log('ALL CANDIDATES IN STATE', stateValidators.getCandidates());

 const initConsensus = async () => {
  let alice_voter = new Voter(alice_address)
  let peter_voter = new Voter(peter_address)
  
  stateValidators.setCandidate(bob_address)
  stateValidators.setCandidate(plasma_address)
  stateValidators.setCandidate(sofiya_address)
  stateValidators.setCandidate(rosetta_address)
  stateValidators.setCandidate(carol_address)
  stateValidators.setCandidate(eve_address)
  stateValidators.setCandidate(dan_address)

  alice_voter.addStake(2, rosetta_address);
  peter_voter.addStake(3, bob_address);
  peter_voter.addStake(5, plasma_address);

  stateValidators.voteCandidates()

  // console.log('vote candidates',await stateValidators.voteCandidates())
  
  // console.log('getAll validators', await validatorsQueue.getAllvalidators());
  // alice_voter.addStake(6, vova_address);
  // alice_voter.wantToVote() 
  // peter_voter.wantToVote()
  
//   setTimeout(async ()=>{
//     // console.log('getAll validators 2',await validatorsQueue.getAllvalidators());
//     // console.log('getCurrentvalidator',await validatorsQueue.getCurrentvalidator());
    
//     await validatorsQueue.setNextValidator()

//     // console.log('getCurrentvalidator',await validatorsQueue.getCurrentvalidator());
//   }, 500)
}


// setTimeout(()=>{

//   validatorsQueue.delAllValidators()

// }, 1000)

export { initConsensus }
