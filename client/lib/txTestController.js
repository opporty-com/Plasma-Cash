
import { createSignedTransaction } from 'lib/helpers/tx';
import web3 from 'lib/web3';
import Promise from 'bluebird';
import config from "config";
const ethUtil = require('ethereumjs-util'); 
import RLP from 'rlp';
import txPool from 'lib/txPool';
import { getAllUtxosWithKeys } from 'lib/helpers/tx';


let accounts = [
  '0x2BF64b0ebd7Ba3E20C54Ec9F439c53e87E9d0a70'.toLowerCase(),
  '0x11A618DE3ADe9B85Cd811BF45af03bAd481842Ed'.toLowerCase(), 
  '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe'.toLowerCase(),
  '0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7'.toLowerCase(),
  '0x220cD6eBB62F9aD170C9bf7984F22A3afc023E7d'.toLowerCase()
];

let prkeys = {};
prkeys[accounts[0]] = Buffer.from('de3385a80c15c12bc7dd7800f5d383229569269016e6501a2714a3a77885007a', 'hex');
prkeys[accounts[1]] = Buffer.from('86737ebcbdfda1c14a069782b585fed4fb15847206ca179ea8988161ddbb8ad6', 'hex');
prkeys[accounts[2]] = Buffer.from('06889a2975e9db1487e33ea76f82a034660de671d0594e9470d4f7be4b6feaf1', 'hex');
prkeys[accounts[3]] = Buffer.from('723851e910975a4ff44b2ec28b719c42ae3c9ea33c187abaa018292a02d5e9a9', 'hex');
prkeys[accounts[4]] = Buffer.from('25d9bb435e7d96e692054668add7f8b857567b2075b9e2f6b0659c4b6c7ed31c', 'hex');

class TestTransactionsCreator {
    constructor () {
        this.ready = false;
        this.utxos = [];
        this.alltransactions = [];
        
        this.nextAddressGen = getNextAddress(accounts);
        this.nextAddressGen.next();
        this.blockCreatePromise = Promise.resolve(true);
    }

    async createTransactionsFromUTXO() {
      this.utxos = await getAllUtxosWithKeys();
      this.alltransactions = [];

      for (let i in this.utxos) {
          let utxo = this.utxos[i];
          let blockNumber = parseInt(i.split('_')[1]);

          try {
            let txData = {
              prev_hash:  utxo.getHash().toString('hex'),
              prev_block: blockNumber,
              token_id: utxo.token_id.toString(),
              new_owner: this.nextAddressGen.next(utxo.new_owner).value
            };
            let txDataForRlp = [ethUtil.addHexPrefix(txData.prev_hash), txData.prev_block, ethUtil.toBuffer(txData.token_id), txData.new_owner];
            let txRlpEncoded = ethUtil.hashPersonalMessage(ethUtil.sha3(RLP.encode(txDataForRlp)));
            
            if (utxo.new_owner instanceof Buffer)
              utxo.new_owner = ethUtil.addHexPrefix(utxo.new_owner.toString('hex')).toLowerCase();

            let signature = ethUtil.ecsign(txRlpEncoded, prkeys[utxo.new_owner]);
            
            txData.signature = ethUtil.toRpcSig(signature.v, signature.r, signature.s).toString("hex");
            let createdTx = createSignedTransaction(txData);
            this.alltransactions.push(createdTx);
          } catch (e) {
            console.log(e);
          }
      }

      console.log('TXcount - ', this.alltransactions.length);
  }

    async init() {
        try {
            for (let address of accounts) {
              await web3.eth.personal.unlockAccount(address, config.plasmaOperatorPassword, 0);
              console.log('Unlock account: ', address);
            }
            await this.createTransactionsFromUTXO();
            setInterval(()=> this.createTransactionsFromUTXO(), 60000);
        }
        catch (err) {
            console.log('error', err);
            this.ready = false;
        }
    }

    async createNewTransactions(req) {
      return await txPool.addTransaction(this.alltransactions[parseInt(req.headers['test'])]);
    }

}
    function* getNextAddress(addresses) {
        let currentAddress = 0;
        let addressToExclude;
        while(true) {
          if (!addresses[++currentAddress]) {
              currentAddress = 0;
          }
          if (addressToExclude && addresses[currentAddress] == addressToExclude) {
              if (!addresses[++currentAddress]) {
                  currentAddress = 0;
                 if (addresses[currentAddress] == addressToExclude) {
                  currentAddress++;
                 }
              }
          }
          addressToExclude = yield addresses[currentAddress];
        }
      }

const testTransactionsCreator = new TestTransactionsCreator;

//if (config.isDevelopment)
  testTransactionsCreator.init();

export default testTransactionsCreator;
