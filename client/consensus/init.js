import { stateValidators, Voter, minersQueue  } from 'consensus'



const george_address = '0xcDd97e8350e93eeD3224A217A42d28cF0276b67b',
  peter_address = '0xbc01Cd4A866c557623F83db195C64b0785F62d01',
  sofiya_address = '0xE2201Ef12c3216750513F900fea533eeEa63e7EF',
  plasma_address = '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  malbora_address = '0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8',
  rosetta_address = '0x2AdC318Ac93A7289f83Aa7F26513bC0d15f0Ab3e',

  denis_address = '0x4CCa94A907A979f105bfsE1e0FB713ED3A478F86',
  vlad_address = '0x3d90A916Af5163cAC1A0emc822D47eF224E85711',
  vova_address = '0x2AdC318Ac93A7289f83AavF26513bC0d15f0Ab3e',
  vitya_address = '0x2AdC318Ac93A7289f83Ag7F26513bC0d15f0Ab3e',
  toha_address = '0x2AdC318Ac93A7289f83AarF26513bC0d15f0Ab3e',
  ganas_address = '0x4CCa94A907A979f105bfwE1e0FB713ED3A478F86',
  sanya_address = '0x3d90A916Af5163cAC1A0s2c822D47eF224E85711'



// (async () =>{

// })()
// minersQueue.getAllMiners();
// stateValidators.getCandidates();
// console.log('ALL MINERS IN QUEUE',);

// console.log('ALL CANDIDATES IN STATE', stateValidators.getCandidates());

 const initConsensus = async () => {
  let george_voter = new Voter(george_address)
  let peter_voter = new Voter(peter_address)
  
  stateValidators.setCandidate(malbora_address)
  stateValidators.setCandidate(plasma_address)
  stateValidators.setCandidate(sofiya_address)
  stateValidators.setCandidate(rosetta_address)
  stateValidators.setCandidate(denis_address)
  stateValidators.setCandidate(toha_address)
  stateValidators.setCandidate(vlad_address)
  stateValidators.setCandidate(ganas_address)
  stateValidators.setCandidate(sanya_address)
  stateValidators.setCandidate(vova_address)
  stateValidators.setCandidate(vitya_address)

  george_voter.addStake(2, rosetta_address);
  peter_voter.addStake(3, malbora_address);
  peter_voter.addStake(5, plasma_address);

  console.log('vote candidates',await stateValidators.voteCandidates())
  
  console.log('getAll miners', await minersQueue.getAllMiners());
  // george_voter.addStake(6, vova_address);
  // george_voter.wantToVote()
  // peter_voter.wantToVote()
  
  setTimeout(async ()=>{
    console.log('getAll miners 2',await minersQueue.getAllMiners());
    console.log('getCurrentMiner',await minersQueue.getCurrentMiner());
    
    await minersQueue.setNextMiner()

    console.log('getCurrentMiner',await minersQueue.getCurrentMiner());
  }, 500)
}


// setTimeout(()=>{

//   minersQueue.delAllMiners()

// }, 1000)

export { initConsensus }
