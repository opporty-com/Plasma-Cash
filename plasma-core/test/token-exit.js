import chai from 'chai';
import chai_things from 'chai-things';
import BN from 'bn.js'
import * as RLP from 'rlp'
import web3 from "../src/root-chain/web3";
import * as ethUtil from "ethereumjs-util";
import {client, promise as plasma} from "../src/api/lib/plasma-client";
import contractHandler from '../src/root-chain/contracts/plasma';

const { expect } = chai;
const acc = {
  address: '0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417',
  password: '123456',
  privateKey: 'a9f0374e8bbe95682d3a4230068b631223c81b985a782c2d71ace7eb0a679122'
};

chai.should();
chai.use(chai_things);

describe("EXIT TOKEN", () => {
  it(`Should exit token by address: ${acc.address}`, async () => {
    await web3.eth.personal.unlockAccount(acc.address, acc.password, 1000);
    console.log(`1. Account ${acc.address} unlocked!`);

    client();
    const answer = await plasma({
      action: "getTokenByAddress",
      payload: {address: Buffer.from(ethUtil.stripHexPrefix(acc.address), 'hex')}
    });
    console.log(`2. Answer for "getTokenByAddress" and address ${acc.address}:`, answer);

    expect(answer).to.be.an('object');
    expect(answer.tokens).to.be.an('array').that.is.not.empty;

    const index = answer.tokens.findIndex(t => t.status === 1);
    if (index === -1) throw new Error(`No active tokens by address ${acc.address}`);
    const token = answer.tokens[index];
    console.log('====> Token to use for test exit:', token.id);
    expect(token.id).to.be.string;

    console.log('======================================================================================');
    console.log('=============================START FORMING EXIT PARAMS================================');
    const exitParams = await getExitParams({contractHandler, tokenId: token.id, address: acc.address});
    console.log('EXIT PARAMS    |', exitParams);
    console.log('=============================END OF FORMING EXIT PARAMS================================');
    console.log('=======================================================================================');
    console.log('10. Start execute startExit function...');
    const tokenEx = await contractHandler.startExit({address: acc.address, password: acc.password, exitParams});
    console.log('====> Return:', tokenEx);
    expect(tokenEx.exitId).to.be.string;

    const getEx = await contractHandler.getExit(tokenEx.exitId);
    console.log('11. Return from getExit:', getEx);
  })
});



async function getExitParams({contractHandler, tokenId, address}) {
  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});
  console.log('------------------------------------------');
  console.log(`3. Last transaction of ${address} by token ${tokenId}:`, lastTx);
  expect(lastTx).to.be.an('object');
  expect(lastTx.tokenId).to.be.string;
  expect(lastTx.blockNumber).to.be.a('number');

  if (lastTx.error)
    throw new Error(lastTx.message);
  if (ethUtil.stripHexPrefix(lastTx.newOwner.toString('hex').toLowerCase()) !== ethUtil.stripHexPrefix(address.toLowerCase()))
    throw new Error('wrong owner');

  const prevTx = await plasma({action: "getTransactionByHash", payload: {hash: lastTx.prevHash}});
  console.log(`4. Previous transaction of transaction (hash: ${lastTx.hash.toString('hex')}):`, prevTx);
  console.log('------------------------------------------');
  expect(prevTx).to.be.an('object');
  expect(prevTx.tokenId).to.be.string;
  expect(prevTx.blockNumber).to.be.a('number');
  expect(prevTx.prevBlock).to.be.a('number');

  const prevBlockNum = lastTx.prevBlock;
  const blockNum = lastTx.blockNumber;

  const txRpl = createRpl(lastTx);
  const txPrevRpl = createRpl(prevTx);
  const txProof = (await plasma({action: "getProof", payload: {tokenId, blockNumber: blockNum}})).hash;
  console.log(`5. Get proof for LAST transaction:`, txProof);
  expect(txProof.length).to.be.not.equal(0);

  const txPrevProof = (await plasma({action: "getProof", payload: {tokenId, blockNumber: prevBlockNum}})).hash;
  console.log(`6. Get proof for PREVIOUS transaction:`, txPrevProof);
  expect(txPrevProof.length).to.be.not.equal(0);

  const txBlock = await plasma({action: "getBlock", payload: {number: blockNum}});
  const txPrevBlock = await plasma({action: "getBlock", payload: {number: prevBlockNum}});
  if (!(await contractHandler.checkProof(ethUtil.addHexPrefix(lastTx.hash.toString('hex')), ethUtil.addHexPrefix(txBlock.merkleRootHash.toString('hex')), txProof)))
    throw new Error('txProof was marked as INCORRECT by checkProof function!');
  console.log('7. txProof correct!');
  if (!(await contractHandler.checkProof(ethUtil.addHexPrefix(prevTx.hash.toString('hex')), ethUtil.addHexPrefix(txPrevBlock.merkleRootHash.toString('hex')), txPrevProof)))
    throw new Error('txPrevProof was marked as INCORRECT by checkProof function!');
  console.log('8. txPrevProof correct!');
  console.log('============CHECK RLP=============');
  console.log('============txRpl=============');
  console.log('HASH IN TR     |', lastTx.hash);
  console.log('FORMED IN TEST |', ethUtil.keccak(txRpl));
  console.log('============txPrevRpl=============');
  console.log('HASH IN TR     |', prevTx.hash);
  console.log('FORMED IN TEST |', ethUtil.keccak(txPrevRpl));
  console.log('===============END================');
  console.log('FORMED MAIN PARAMS:', {blockNum, txRpl, txPrevRpl, txProof, txPrevProof, address});

  const estimateGas = await contractHandler.estimateStartExit({blockNum, txRpl, txPrevRpl, txProof, txPrevProof, address});
  console.log('9. Estimated gas amount:', estimateGas);
  expect(estimateGas).to.be.a('number');
  return {blockNum, txRpl, txPrevRpl, txProof, txPrevProof, estimateGas};
}

function createRpl(tx) {
  const {prevHash, prevBlock, tokenId, newOwner, type, totalFee, fee,  data='', signature} = tx;
  let dataToEncode = [
    prevHash,
    prevBlock,
    new BN(tokenId),
    newOwner,
    type,
    new BN(totalFee),
    new BN(fee),
    data,
    signature
  ];
  return RLP.encode(dataToEncode);
}
