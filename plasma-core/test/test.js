import web3 from 'lib/web3';
import config from "config";
import contractHandler from 'root-chain/contracts/plasma';
import ethUtil from 'ethereumjs-util';

const BN = ethUtil.BN;

let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70',
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed', 
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe',
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7',
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'
];
async function createDeposits(options = {}) {

  for (let addr of accounts) {
    await web3.eth.personal.unlockAccount(addr, config.plasmaNodePassword, 90000);
    console.log('unlockAccount', addr);
  }
  let deposits = options.deposits || 5;
  var nextAddressGen = getNextAddress(accounts);

  let created = 0;
  for (let i = 0; i < deposits; i++) {
    try {
      let address = nextAddressGen.next().value;
      let amount = new BN('1000000000000000');
      let add = new BN('10000000000000');
      add = add.mul(new BN(i + 1));    
      amount = amount.add(add).toString();
    
      contractHandler.contract.methods.deposit().estimateGas({from: address, value: amount})
        .then(gas => {
            console.log('done deposit to contract!');
          return contractHandler.contract.methods.deposit().send({from: address, gas, value: amount});
        }).catch(error => {
          console.log('error' , error.toString())
        })
      created++;
    }
    catch (error){
      console.log('Create deposit error', error);
    }
  }
  return created;
}

function* getNextAddress(addresses) {
  let currentAddress = 0;
  let address;
  
  while(true) {
    if (!addresses[++currentAddress]) {
      currentAddress = 0;
    }
    if (address && addresses[currentAddress] == address) {
      if (!addresses[++currentAddress]) {
        currentAddress = 0;
        if (addresses[currentAddress] == address) {
          currentAddress++;
        }
      }
    }
    address = yield addresses[currentAddress];
  }
}

export { createDeposits };
