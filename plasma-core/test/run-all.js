//This script is needed to run command "npm run test-system"
const ACCOUNTS = ['0x5F37D668c180584C99eeb3181F2548E66524663b', '0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417'];
console.log('*******************SHORT DESCRIPTION*********************');
console.log('It should:');
console.log('1. Create deposit(token) by address', ACCOUNTS[0]);
console.log("2. Change the created token's owner to", ACCOUNTS[1]);
console.log('3. Exit the created token at', ACCOUNTS[1]);
// console.log(`4. Add as candidate ${ACCOUNTS[0].address} and vote for him ${process.env.CANDIDATE_COUNT_VOTES} times from ${ACCOUNTS[1].address} to make him "operator"`);
console.log('*********************************************************');

require('./token-create-deposit');
require('./token-change-owner');
require('./token-exit');
// require('./voting-for-candidate');

after(() => setTimeout(() => process.exit(200), 1000));
