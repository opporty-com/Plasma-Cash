import assert from "assert";
const  Root = artifacts.require("./Root.sol");
import ethUtil from 'ethereumjs-util';

import { PlasmaTransaction } from "./model/tx"; 
import  Block  from "./model/block";

import { utils as u } from "web3";
import RLP from "rlp";
const BN = ethUtil.BN;

function createDepositTransaction(addressTo, amountBN, depositBlockIndexBN) {
    let empty = '';
    let txData = {
      blockNumber1: depositBlockIndexBN,
      txNumber1: empty,
      outputNumber1: empty,
      blockNumber2: empty,
      txNumber2: empty,
      outputNumber2: empty,
      newowner1: addressTo,
      denom1: amountBN,
      newowner2: 0,
      denom2: empty
    };
    const tx = new PlasmaTransaction(txData);
  
    return tx;
}

const increaseTime = function(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
   
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1)

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id+1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}

contract('Test', function(accounts) {

    it('should test that the Root contract can be deployed', function(done) {
        Root.new().then(function(instance){
          assert.ok(instance.address);
        }).then(done);
    });

    it('should blocknumber and depositnumber be initialized properly', async function() {
        const root = await Root.new();
        const currentBlock = await root.getCurrentBlock();
        assert.equal(currentBlock.toNumber(), 1000);
        const depositBlock = await root.getDepositBlock();
        assert.equal(depositBlock.toNumber(), 1);
    });

    it('should be deposited', async function() {
        const root = await Root.new();
        const blknum = await root.getDepositBlock();
        const val = 100;
        const {logs} = await root.deposit({ value: val });

        const result = await root.getChain(blknum);
        assert.equal(result[0], u.soliditySha3( accounts[0], val));

        const event = logs.find(e => e.event === 'Deposit');
        assert.ok(event, "event Deposit should exists");
      
    });

    it('should be correctly rlpencoded', async function() {

        const root = await Root.new();
        const accounts0 = '0x3ab059da310dc06c2c08993818cb5ffab48c8bb3';
        const null_address = '0x0000000000000000000000000000000000000000';
        const val = 100;
        const tx = new createDepositTransaction(accounts0, 100, 0);

        var rlpencoded = u.bytesToHex(tx.getRlp(true));
        assert.equal(rlpencoded, '0xf3808080808080943ab059da310dc06c2c08993818cb5ffab48c8bb3649400000000000000000000000000000000000000008080');
        
        const tx2 = await root.getTransactionFromRLP(rlpencoded);
        assert.equal(tx2[0].toNumber(), 0);
        assert.equal(tx2[1].toNumber(), 0);
        assert.equal(tx2[2].toNumber(), 0);
        assert.equal(tx2[3].toNumber(), 0);
        assert.equal(tx2[4].toNumber(), 0);
        assert.equal(tx2[5].toNumber(), 0);
        assert.equal(tx2[6], accounts0);
        assert.equal(tx2[7].toNumber(), 100);
        assert.equal(tx2[8], null_address);
        assert.equal(tx2[9].toNumber(), 0);
        assert.equal(tx2[10].toNumber(), 0);
    });

    it('should return correct signature', function(done) {
        const accounts0 = '0x9251d3a5c4b5402a335f57654ff2846ceeb92c27';
        const null_address = '0x0000000000000000000000000000000000000000';
        const val  = 100;
        let tx = new createDepositTransaction(accounts0, 100, 1);

        const key = u.hexToBytes('0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6');
        tx.sign1(key);

        assert.equal(tx.sig1, '0x4e3d975d0fbb1c2b49084694ebaa645afa036ab6feff887348bc4d3cb6546acf49b87a3144c1113c66de63fbfbf0d6d8a1fcedbf5ecfc1450e2608165f8243981b');
        done();
    });

    it('should return correct merkle root', function(done) {
        const accounts0 = '0xadd8742ccb2e0762663ed666060b6a423bad154d';
        const null_address = '0x0000000000000000000000000000000000000000';
        const val  = 100;

        let tx = new createDepositTransaction(accounts0, 100, 1);

        const blk = new Block({
            blockNumber: 1,
            transactions: [ tx ]
        });

        assert.equal(ethUtil.bufferToHex(blk.merkleRootHash), '0x15cbc5df29765a2c836228ca61ab05d28b5bb727b5de124ea687882e65d4c225'); 
        done();
    })

    it ('should exit', async function() {

        const root = await Root.new();
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');

        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);

        let tx = new createDepositTransaction(accounts[0], 100, '');

        const txBytes2 = tx.getRlp(true);
        tx.sign1(key);

        let blk = new Block({
            blockNumber: blknum,
            transactions: [ tx ]
        });

        let proof = "0x"+Buffer.concat(blk.merkle.getProof(0, true)).toString('hex') ;
        if (proof=="0x") {
            proof = "0x0";
        }
        const currentBlock = await root.getCurrentBlock();
        assert.equal(currentBlock.toNumber(), 1000);

        const res = await root.submitBlock(ethUtil.bufferToHex( blk.merkleRootHash) );
        const event3 = res.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event3, "event BlockSubmitted should exists");

        const confirmSig1 = tx.confirm( (await root.getChain(1000))[0], key );

        const sigs = u.bytesToHex( u.hexToBytes(tx.sig1).concat( u.hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'), u.hexToBytes(confirmSig1)  ));

        const {logs} = await root.startExit(currentBlock.toNumber(), 0, 0, ethUtil.bufferToHex(txBytes2), proof, sigs );
        const event = logs.find(e => e.event === 'Exit');
        assert.ok(event, "event Exit should exists");
        const priority = 1000 * 1000000000 + 10000 * 0 + 0;
        const exit = await root.getExit(priority);
        assert.equal(exit[0], accounts[0]);
        assert.equal(exit[1].toNumber(), 100);
    });

    it ('should challenge exit', async function() {
        const root = await Root.new();
        const null_address = '0x0000000000000000000000000000000000000000';
        const val = 100;
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const dblknum = (await root.getDepositBlock()).toNumber();
        const utxo_pos1 = dblknum * 1000000000 + 1;
        await root.deposit({value: val});

        let tx = new createDepositTransaction(accounts[0], 100, '');

        //let tx = new Transaction('', '', '', '', '', '', accounts[0], parseInt(val), null_address, '', '', '', '', 1);
        const txBytes2 = tx.getRlp(true);    
        tx.sign1(key);

        const {logs} = await root.startDepositExit(utxo_pos1, val)
        const event = logs.find(e => e.event === 'Exit');
        assert.ok(event, "event Exit should exists");

        const tx2 = new createDepositTransaction(accounts[0], 100, dblknum);
        tx2.sign1(key)
        const tx_bytes2  = tx2.getRlp(true);  
        let blknum = (await root.getCurrentBlock()).toNumber();

        let blk = new Block({
            blockNumber: blknum,
            transactions: [ tx2 ]
        });
        
        let proof = "0x" + Buffer.concat(blk.merkle.getProof(0)).toString('hex');
        if (proof=="0x") {
            proof = "0x0";
        }

        blknum = (await root.getCurrentBlock()).toNumber();
        const res3 = await root.submitBlock(ethUtil.bufferToHex(blk.merkleRootHash));

        const event3 = res3.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event3, "event BlockSubmitted should exists");
        const confirmSig = tx2.confirm( (await root.getChain(blknum))[0], key );
        const sigs = u.bytesToHex(u.hexToBytes(tx2.sig1).concat(u.hexToBytes(tx2.sig2)));
        const utxo_pos2 = blknum * 1000000000 + 10000 * 0 + 0

        const exit = await root.getExit(utxo_pos1);
        assert.equal(exit[0], accounts[0]);
        assert.equal(exit[1].toNumber(), 100);
        
        const res = await root.challengeExit(utxo_pos1, blknum, ethUtil.bufferToHex(tx_bytes2), proof, sigs, confirmSig)
        
        const event2 = res.logs.find(e => e.event === 'ExitChallengedEvent');
        assert.ok(event2, "event ExitChallengedEvent should exists");
        
    });

    it ('should finalize exits', async function() {
        const root = await Root.new();
        const two_weeks = 60 * 60 * 24 * 14;
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';

        const tx = new createDepositTransaction(accounts[0], 100, '');
        
        const dep1_blknum = (await root.getDepositBlock()).toNumber();
        await root.deposit({value: val});

        const utxo_pos1 = dep1_blknum * 1000000000 + 10000 * 0 + 1
        const {logs} = await root.startDepositExit(utxo_pos1, val)
        const event = logs.find(e => e.event === 'Exit');
        assert.ok(event, "event Exit should exists");

        increaseTime(two_weeks * 2);
        const exit = await root.getExit(utxo_pos1);
        assert.equal(exit[0], accounts[0]);
        assert.equal(exit[1].toNumber(), 100);

        const bal1 = (await root.getBalance(accounts[0]) ).toNumber();
        const res = await root.finalizeExits();
        
        const event2 = res.logs.find(e => e.event === 'ExitCompleteEvent');
        assert.ok(event2, "event ExitCompleteEvent should exists");
        const bal2 = (await root.getBalance(accounts[0]) ).toNumber();
        assert.equal(bal2, bal1 + val);
    });


});