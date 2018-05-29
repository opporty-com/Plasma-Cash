import assert from "assert";
const  Root = artifacts.require("./Root.sol");
import ethUtil from 'ethereumjs-util';
import { PlasmaTransaction } from "./model/tx"; 
import Block  from "./model/block";
import ParticiaMerkle from './lib/ParticiaMerkle';
import { utils as u } from "web3";
import RLP from "rlp";
const BN = ethUtil.BN;

function createDepositTransaction(addressTo, amountBN, token_id) {
    let txData = {
      prev_hash: '',
      prev_block: new BN(0),
      token_id,
      new_owner: ethUtil.addHexPrefix(addressTo)
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
        assert.equal(currentBlock.toNumber(), 0);
        const depositBlock = await root.getDepositBlock();
        assert.equal(depositBlock.toNumber(), 1);
    });

    it('should be correctly rlpencoded', async function() {
        const root = await Root.new();
        const accounts0 = '0x3ab059da310dc06c2c08993818cb5ffab48c8bb3';
        const null_address = '0x0000000000000000000000000000000000000000';
        const val = 100;
        const tx = new createDepositTransaction(accounts0, val, u.soliditySha3(accounts0, val, 0));
        let token_id = u.soliditySha3(accounts0, val, 0);
        var rlpencoded = u.bytesToHex(tx.getRlp(false));
        assert.equal(rlpencoded, '0xf8398000a0a1cec4f3c0349cb34526da97ab6cb46b80f22cfa094014702aafa06373f9aa6b943ab059da310dc06c2c08993818cb5ffab48c8bb380');
        
        const tx2 = await root.getTransactionFromRLP(rlpencoded);

        assert.equal(tx2[0], '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(tx2[1].toNumber(), 0);
        assert.equal(tx2[2].toNumber(), token_id);
        assert.equal(tx2[3], accounts0);
    });

    it('should return correct signature', function(done) {
        const accounts0 = '0x9251d3a5c4b5402a335f57654ff2846ceeb92c27';
        const null_address = '0x0000000000000000000000000000000000000000';
        const val  = 100;
        let tx = new createDepositTransaction(accounts0, 100, 1);

        const key = u.hexToBytes('0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6');
        tx.sign(key);

        assert.equal(tx.signature, '0x7794e68f36a855a4c43299b5cce6c20da6db6b5d72178d9d2ba651e9a7d7b76b221aedf6f6e919a0b36c45c99f8ce8f05cb2b7e7431ff79e58b9b5896fbfb4f31b');
        done();
    });

    it('should return correct merkle root', function(done) {
        const val = 100;

        let tx = new createDepositTransaction(accounts[0], 100, ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 0)));

        const blk = new Block({
            blockNumber: 1,
            transactions: [ tx ]
        });

        assert.equal(ethUtil.bufferToHex(blk.merkleRootHash), '0x90ba4f8d62572f7593b02520cec64098b3f3dbdf0ce9ad067f508ac4494742e6'); 
        done();
    });


    it('should be deposited', async function() {
        const root = await Root.new();
        const blknum = await root.getDepositBlock();
        const val = 100;
        const {logs} = await root.deposit({ value: val });
        const event = logs.find(e => e.event === 'DepositAdded');
        assert.ok(event, "event DepositAdded should exists");

    });

    it ('should submit block', async function() {
        const root = await Root.new();
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';
        const accounts1 = '0x76a89af64a9f9606da8aa24839385bf6cbb6c757';
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');

        const blknum = await root.getDepositBlock();
        assert.equal(blknum.toNumber(), 1);
        await root.deposit({value: val});
        assert.equal((await root.getDepositBlock()).toNumber(), 2);

        let tx = new createDepositTransaction(accounts[0], val, ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 0)));

        const txBytes2 = tx.getRlp(true);
        tx.sign(key);

        let blk = new Block({
            blockNumber: 1,
            transactions: [ tx ]
        });

        const currentBlock = await root.getCurrentBlock();
        assert.equal(currentBlock.toNumber(), 0);

        const res = await root.submitBlock(ethUtil.bufferToHex(blk.merkleRootHash), blk.blockNumber );
        const event = res.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event, "event BlockSubmitted should exists");

        let tx2 = new createDepositTransaction(accounts1, val, ethUtil.toBuffer( u.soliditySha3(accounts1, val, 0)));
        tx2.sign(key);

        let blk2 = new Block({
            blockNumber: 2,
            transactions: [ tx2 ]
        });

        const res2 = await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber );
        const event2 = res2.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event2, "event BlockSubmitted should exists");
        const res3 = await root.getChain(blk.blockNumber);
        assert.ok(res3[0])
        const res4 = await root.getChain(blk.blockNumber);
        assert.ok(res4[0]);
        const res5 = await root.getChain(3);
        assert.equal(res5[0],'0x0000000000000000000000000000000000000000000000000000000000000000');
    });

    it('should return true when proof is valid', function() {
        function getRandomInt(min, max) {
          return Math.floor(Math.random() * (max - min)) + min;
        }
  
        let leaves = [];
  
        for (let i = 1; i <= 1; i++) {
          let key = ethUtil.sha3(getRandomInt(100000, 100000000000000));
          key = new BN(key, 16).toString(10);
          leaves.push({
            key,
            hash: ethUtil.sha3(getRandomInt(100000, 100000000000000))
          });
        }
        
        let start = Date.now();
        let tree = new ParticiaMerkle(leaves);
        tree.buildTree();
        let root = tree.getMerkleRoot()
  
        leaves.forEach(leaf => {
          let proof = tree.getProof(leaf.key);
          let proofIsValid = tree.checkProof(proof, leaf.hash, root);
        
          assert.ok(proofIsValid);
        });
      });

    it ('should exit', async function() {
        const root = await Root.new();
        const val = 100;
      
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const key2 = u.hexToBytes('0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        
        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        const dres = await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);

        const dev = dres.logs.find(e => e.event === 'DepositAdded');
        assert.ok(dev, "event DepositAdded should exists");
        let token_id_num = dev.args.tokenId.toString(10);
        
        let token_id = ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 1));

        let tx = new createDepositTransaction(accounts[0], 100, token_id );
        tx.sign(key);
        const txBytes = tx.getRlp(false);
        
        let blk2 = new Block({
            blockNumber: 1,
            transactions: [ tx ]
        });
        
        let proof = ethUtil.addHexPrefix( blk2.merkle.getProof(token_id_num, true) );
        
        const res2 = await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber );
        const event2 = res2.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event2, "event BlockSubmitted should exists");

        let txData = {
            prev_hash: tx.getHash(),
            prev_block: new BN(1),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx2 = new PlasmaTransaction(txData);
        tx2.sign(key);
        const txBytes2 = tx2.getRlp(false);
        
        let blk3 = new Block({
            blockNumber: 2,
            transactions: [ tx2 ]
        });

        let proof2 = ethUtil.addHexPrefix(blk3.merkle.getProof(token_id_num, true)  );

        const res3 = await root.submitBlock(ethUtil.bufferToHex(blk3.merkleRootHash), blk3.blockNumber );
        const event3 = res3.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event3, "event BlockSubmitted should exists");

        const res5 = await root.getToken(ethUtil.bufferToHex(token_id) );
        assert.ok( res5 );

        const res4 = await root.startExit(2, ethUtil.bufferToHex(txBytes2), ethUtil.bufferToHex(txBytes), proof2, proof, {from: accounts[1] });
        
        const event4 = res4.logs.find(e => e.event === 'ExitAdded');
        assert.ok(event4, "event ExitAdded should exists");
        let exitId = event4.args.exitId;

        const res6 = await root.getExit(exitId);
        assert.equal(res6[2], 100);
    });

    it('should challenge exit', async function() {
        const root = await Root.new();
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const key2 = u.hexToBytes('0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        
        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        const dres  = await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);
        const dev = dres.logs.find(e => e.event === 'DepositAdded');
        let token_id_num = dev.args.tokenId.toString(10);

        let token_id = ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 1));

        let tx = new createDepositTransaction(accounts[0], 100, token_id );
        tx.sign(key);
        const txBytes = tx.getRlp(false);
        
        let blk2 = new Block({ blockNumber: 1, transactions: [ tx ] });

        let proof = ethUtil.addHexPrefix(blk2.merkle.getProof( token_id_num, true ));
        
        await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber);
        // -----------
        let txData = {
            prev_hash: tx.getHash(),
            prev_block: new BN(1),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx2 = new PlasmaTransaction(txData);
        tx2.sign(key);
        const txBytes2 = tx2.getRlp(false);
        
        let blk3 = new Block({ blockNumber: 2, transactions: [ tx2 ] });

        let proof2 = ethUtil.addHexPrefix(blk3.merkle.getProof( token_id_num, true));

        await root.submitBlock(ethUtil.bufferToHex(blk3.merkleRootHash), blk3.blockNumber );
        // -----------
        txData = {
            prev_hash: tx2.getHash(),
            prev_block: new BN(2),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[0])
        };
          
        const tx3 = new PlasmaTransaction(txData);
        tx3.sign(key2);
        const txBytes3 = tx3.getRlp(false);
        
        let blk4 = new Block({ blockNumber: 3, transactions: [ tx3 ] });

        let proof3 = ethUtil.addHexPrefix(blk4.merkle.getProof(token_id_num, true));

        const res4 = await root.submitBlock(ethUtil.bufferToHex(blk4.merkleRootHash), blk4.blockNumber );
        const event4 = res4.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event4, "event BlockSubmitted should exists");
        // ------------

        const res5 = await root.startExit(2, ethUtil.bufferToHex(txBytes2), ethUtil.bufferToHex(txBytes), proof2, proof, {from: accounts[1] });
        
        const event5 = res5.logs.find(e => e.event === 'ExitAdded');
        assert.ok(event5, "event ExitAdded should exists");
        let exitId = event5.args.exitId;

        // -------------
        const res6 = await root.challengeSpent(exitId, 3, ethUtil.bufferToHex(txBytes3), proof3 );
        const event6 = res6.logs.find(e => e.event === 'ExitChallengedEvent');
        assert.ok(event6, "event ExitChallengedEvent should exists");

        const res7 = await root.getExit(exitId);
        assert.equal(res7[2], 0);
        
    });

    it ('should challenge double spend exit', async function() {
        const root = await Root.new();
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const key2 = u.hexToBytes('0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        
        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        const dres = await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);

        const dev = dres.logs.find(e => e.event === 'DepositAdded');
        let token_id_num = dev.args.tokenId.toString(10);

        let token_id = ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 1));

        let tx = new createDepositTransaction(accounts[0], 100, token_id );
        tx.sign(key);
        const txBytes = tx.getRlp(false);
        
        let blk2 = new Block({ blockNumber: 1, transactions: [ tx ] });

        let proof = ethUtil.addHexPrefix(blk2.merkle.getProof(token_id_num, true) );
        
        await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber);
        // -----------
        let txData = {
            prev_hash: tx.getHash(),
            prev_block: new BN(1),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx2 = new PlasmaTransaction(txData);
        tx2.sign(key);
        const txBytes2 = tx2.getRlp(false);
        
        let blk3 = new Block({ blockNumber: 2, transactions: [ tx2 ] });

        let proof2 = ethUtil.addHexPrefix(blk3.merkle.getProof(token_id_num, true) );

        await root.submitBlock(ethUtil.bufferToHex(blk3.merkleRootHash), blk3.blockNumber );
        // -----------
        txData = {
            prev_hash: tx2.getHash(),
            prev_block: new BN(2),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[0])
        };
          
        const tx3 = new PlasmaTransaction(txData);
        tx3.sign(key2);
        const txBytes3 = tx3.getRlp(false);
        
        let blk4 = new Block({ blockNumber: 3, transactions: [ tx3 ] });

        let proof3 = ethUtil.addHexPrefix(blk4.merkle.getProof(token_id_num, true) );

        const res4 = await root.submitBlock(ethUtil.bufferToHex(blk4.merkleRootHash), blk4.blockNumber );
        const event4 = res4.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event4, "event BlockSubmitted should exists");
        // ------------
        txData = {
            prev_hash: tx2.getHash(),
            prev_block: new BN(2),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[0])
        };
          
        const tx4 = new PlasmaTransaction(txData);
        tx4.sign(key2);
        const txBytes4 = tx4.getRlp(false);
        
        let blk5 = new Block({ blockNumber: 4, transactions: [ tx4 ] });

        let proof4 = ethUtil.addHexPrefix(blk5.merkle.getProof(token_id_num, true) );

        const res5 = await root.submitBlock(ethUtil.bufferToHex(blk5.merkleRootHash), blk5.blockNumber );
        const event5 = res5.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event5, "event BlockSubmitted should exists");
        // ------------
        const res6 = await root.startExit(4, ethUtil.bufferToHex(txBytes4), ethUtil.bufferToHex(txBytes2), proof4, proof2, {from: accounts[0] });
        
        const event6 = res6.logs.find(e => e.event === 'ExitAdded');
        assert.ok(event6, "event ExitAdded should exists");
        let exitId = event6.args.exitId;

        const res7 = await root.challengeDoubleSpend(exitId, 3, ethUtil.bufferToHex(txBytes3), proof3 );
        const event7 = res7.logs.find(e => e.event === 'ExitChallengedEvent');
        assert.ok(event7, "event ExitChallengedEvent should exists");

        const res8 = await root.getExit(exitId);
        assert.equal(res8[2], 0);
    });

    it ('should challenge invalid history exit', async function() {
        const root = await Root.new();
        const val = 100;
        const null_address = '0x0000000000000000000000000000000000000000';
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const key2 = u.hexToBytes('0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        
        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        const dres = await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);

        const dev = dres.logs.find(e => e.event === 'DepositAdded');
        let token_id_num = dev.args.tokenId.toString(10);

        let token_id = ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 1));

        let tx = new createDepositTransaction(accounts[0], 100, token_id );
        tx.sign(key);
        const txBytes = tx.getRlp(false);
        
        let blk = new Block({ blockNumber: 1, transactions: [ tx ] });

        let proof = ethUtil.addHexPrefix( blk.merkle.getProof(token_id_num, true) ) ;
        
        await root.submitBlock(ethUtil.bufferToHex(blk.merkleRootHash), blk.blockNumber);
        // -----------
        let txData = {
            prev_hash: tx.getHash(),
            prev_block: new BN(1),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx2 = new PlasmaTransaction(txData);
        tx2.sign(key);
        const txBytes2 = tx2.getRlp(false);
        
        let blk2 = new Block({ blockNumber: 2, transactions: [ tx2 ] });

        let proof2 = ethUtil.addHexPrefix( blk2.merkle.getProof(token_id_num, true) );

        await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber );
        // -----------
        txData = {
            prev_hash: tx2.getHash(),
            prev_block: new BN(2),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[0])
        };
          
        const tx3 = new PlasmaTransaction(txData);
        tx3.sign(key2);
        const txBytes3 = tx3.getRlp(false);
        
        let blk3 = new Block({ blockNumber: 3, transactions: [ tx3 ] });

        let proof3 = ethUtil.addHexPrefix( blk3.merkle.getProof(token_id_num, true) );

        await root.submitBlock(ethUtil.bufferToHex(blk3.merkleRootHash), blk3.blockNumber );
        // -----------
        txData = {
            prev_hash: tx3.getHash(),
            prev_block: new BN(3),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx4 = new PlasmaTransaction(txData);
        tx4.sign(key);
        const txBytes4 = tx4.getRlp(false);
        
        let blk4 = new Block({ blockNumber: 4, transactions: [ tx4 ] });

        let proof4 = ethUtil.addHexPrefix( blk4.merkle.getProof(token_id_num, true) );

        await root.submitBlock(ethUtil.bufferToHex(blk4.merkleRootHash), blk4.blockNumber );
        // ------------
        txData = {
            prev_hash: tx4.getHash(),
            prev_block: new BN(4),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[0])
        };
          
        const tx5 = new PlasmaTransaction(txData);
        tx5.sign(key2);
        const txBytes5 = tx5.getRlp(false);
        
        let blk5 = new Block({ blockNumber: 5, transactions: [ tx5 ] });

        let proof5 = ethUtil.addHexPrefix(blk5.merkle.getProof(token_id_num, true));

        const res5 = await root.submitBlock(ethUtil.bufferToHex(blk5.merkleRootHash), blk5.blockNumber );
        const event5 = res5.logs.find(e => e.event === 'BlockSubmitted');
        assert.ok(event5, "event BlockSubmitted should exists");
        
        const res6 = await root.startExit(5, ethUtil.bufferToHex(txBytes5), ethUtil.bufferToHex(txBytes4), proof5, proof4, {from: accounts[0] });
        
        const event6 = res6.logs.find(e => e.event === 'ExitAdded');
        assert.ok(event6, "event ExitAdded should exists");
        let exitId = event6.args.exitId;

        const res7 = await root.challengeInvalidHistory(exitId, 2, ethUtil.bufferToHex(txBytes2), proof2 );
        const event7 = res7.logs.find(e => e.event === 'ChallengedInvalidHistory');
        assert.ok(event7, "event ChallengedInvalidHistory should exists");

        const res8 = await root.respondChallenge(exitId, 3, ethUtil.bufferToHex(txBytes3), proof3 );
        const event8 = res8.logs.find(e => e.event === 'ExitRespondedEvent');
        assert.ok(event8, "event ExitRespondedEvent should exists");
    });

    it ('should finalize exits', async function() {
        const root = await Root.new();
        const val = 100;
        const two_weeks = 60 * 60 * 24 * 14;
        const key = u.hexToBytes('0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        const key2 = u.hexToBytes('0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9');
        
        const blknum = await root.getDepositBlock();
        assert.equal(blknum, 1);
        const dres = await root.deposit({value: val, sender: accounts[0]});
        assert.equal(await root.getDepositBlock(), 2);

        let token_id = ethUtil.toBuffer( u.soliditySha3(accounts[0], val, 1));
        const dev = dres.logs.find(e => e.event === 'DepositAdded');
        let token_id_num = dev.args.tokenId.toString(10);

        let tx = new createDepositTransaction(accounts[0], 100, token_id );
        tx.sign(key);
        const txBytes = tx.getRlp(false);
        
        let blk2 = new Block({ blockNumber: 1, transactions: [ tx ] });

        let proof = ethUtil.addHexPrefix(blk2.merkle.getProof(token_id_num, true) );
        
        await root.submitBlock(ethUtil.bufferToHex(blk2.merkleRootHash), blk2.blockNumber );

        let txData = {
            prev_hash: tx.getHash(),
            prev_block: new BN(1),
            token_id,
            new_owner: ethUtil.addHexPrefix(accounts[1])
        };
          
        const tx2 = new PlasmaTransaction(txData);
        tx2.sign(key);
        const txBytes2 = tx2.getRlp(false);
        
        let blk3 = new Block({ blockNumber: 2, transactions: [ tx2 ] });

        let proof2 = ethUtil.addHexPrefix(blk3.merkle.getProof(token_id_num, true)) ;

        await root.submitBlock(ethUtil.bufferToHex(blk3.merkleRootHash), blk3.blockNumber );

        const res4 = await root.startExit(2, ethUtil.bufferToHex(txBytes2), ethUtil.bufferToHex(txBytes), proof2, proof, {from: accounts[1] });
        
        const event4 = res4.logs.find(e => e.event === 'ExitAdded');
        assert.ok(event4, "event ExitAdded should exists");
        let exitId = event4.args.exitId;

        const res6 = await root.getExit(exitId);
        assert.equal(res6[2], 100);

        increaseTime(two_weeks * 2);

        const bal1 = (await root.getBalance(accounts[0])).toNumber();
        const res = await root.finalizeExits();
        
        const event2 = res.logs.find(e => e.event === 'ExitCompleteEvent');
        assert.ok(event2, "event ExitCompleteEvent should exists");
        const bal2 = (await root.getBalance(accounts[0]) ).toNumber();
        assert.equal(bal2, bal1 + val);
    });


});