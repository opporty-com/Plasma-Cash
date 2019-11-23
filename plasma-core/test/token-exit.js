import chai from 'chai';
import chai_things from 'chai-things';
import BN from 'bn.js'
import * as RLP from 'rlp'
import web3 from "../src/root-chain/web3";
import * as ethUtil from "ethereumjs-util";
import {client, promise as plasma} from "../src/api/lib/plasma-client";
import contractHandler from '../src/root-chain/contracts/plasma';
import logger from "../src/child-chain/lib/logger";

const { expect } = chai;
const acc = {
  address: '0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417',
  password: '123456',
  privateKey: 'a9f0374e8bbe95682d3a4230068b631223c81b985a782c2d71ace7eb0a679122'
};
const callback = data => process.env.LOG_LEVEL === 'debug' ? console.log(data) : null;

chai.should();
chai.use(chai_things);

describe("EXIT TOKEN", () => {
  it(`Should exit token by address: ${acc.address}`, async () => {
    await web3.eth.personal.unlockAccount(acc.address, acc.password, 1000);
    console.log(`1. Account ${acc.address} unlocked`);

    client();
    const answer = await plasma({
      action: "getTokenByAddress",
      payload: {address: Buffer.from(ethUtil.stripHexPrefix(acc.address), 'hex')}
    });
    console.log(`2. Got answer for "getTokenByAddress" and address ${acc.address}`);
    logger.debug(answer);

    expect(answer).to.be.an('object');
    expect(answer.tokens).to.be.an('array').that.is.not.empty;

    const index = answer.tokens.findIndex(t => t.status === 1);
    if (index === -1) throw new Error(`No active tokens by address ${acc.address}`);
    const token = answer.tokens[index];
    logger.debug(`====> Token to use for test exit: ${token.id}`);
    expect(token.id).to.be.string;

    logger.debug('======================================================================================');
    logger.debug('=============================START FORMING EXIT PARAMS================================');
    const exitParams = await getExitParams({contractHandler, tokenId: token.id, address: acc.address});
    logger.debug('EXIT PARAMS:', callback(exitParams));
    logger.debug('=============================END OF FORMING EXIT PARAMS================================');
    logger.debug('=======================================================================================');
    console.log('10. Start execute startExit function...');
    const tokenEx = await contractHandler.startExit({address: acc.address, password: acc.password, exitParams});
    console.log('====> End of execution');
    logger.debug(tokenEx);
    expect(tokenEx.exitId).to.be.string;

    const getEx = await contractHandler.getExit(tokenEx.exitId);
    console.log('11. Return from getExit:', getEx);
  })
});

after(() => setTimeout(() => process.exit(200), 1000));



async function getExitParams({contractHandler, tokenId, address}) {
  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});
  logger.debug('------------------------------------------');
  console.log(`3. Got last transaction of ${address} by token ${tokenId}`);
  logger.debug(lastTx);
  expect(lastTx).to.be.an('object');
  expect(lastTx.tokenId).to.be.string;
  expect(lastTx.blockNumber).to.be.a('number');

  if (lastTx.error)
    throw new Error(lastTx.message);
  if (ethUtil.stripHexPrefix(lastTx.newOwner.toString('hex').toLowerCase()) !== ethUtil.stripHexPrefix(address.toLowerCase()))
    throw new Error('wrong owner');

  const prevTx = await plasma({action: "getTransactionByHash", payload: {hash: lastTx.prevHash}});
  console.log(`4. Got previous transaction (last tx hash: ${lastTx.hash.toString('hex')})`);
  logger.debug(prevTx);
  logger.debug('------------------------------------------');
  expect(prevTx).to.be.an('object');
  expect(prevTx.tokenId).to.be.string;
  expect(prevTx.blockNumber).to.be.a('number');
  expect(prevTx.prevBlock).to.be.a('number');

  const prevBlockNum = lastTx.prevBlock;
  const blockNum = lastTx.blockNumber;

  const txRpl = createRpl(lastTx);
  const txPrevRpl = createRpl(prevTx);
  const txProof = (await plasma({action: "getProof", payload: {tokenId, blockNumber: blockNum}})).hash;
  console.log(`5. Got proof for LAST transaction`);
  logger.debug(txProof);
  expect(txProof.length).to.be.not.equal(0);

  const txPrevProof = (await plasma({action: "getProof", payload: {tokenId, blockNumber: prevBlockNum}})).hash;
  console.log(`6. Got proof for PREVIOUS transaction`);
  logger.debug(txPrevProof);
  expect(txPrevProof.length).to.be.not.equal(0);

  const txBlock = await plasma({action: "getBlock", payload: {number: blockNum}});
  const txPrevBlock = await plasma({action: "getBlock", payload: {number: prevBlockNum}});
  if (!(await contractHandler.checkProof(ethUtil.addHexPrefix(lastTx.hash.toString('hex')), ethUtil.addHexPrefix(txBlock.merkleRootHash.toString('hex')), txProof)))
    throw new Error('txProof was marked as INCORRECT by checkProof function!');
  console.log('7. txProof correct!');
  if (!(await contractHandler.checkProof(ethUtil.addHexPrefix(prevTx.hash.toString('hex')), ethUtil.addHexPrefix(txPrevBlock.merkleRootHash.toString('hex')), txPrevProof)))
    throw new Error('txPrevProof was marked as INCORRECT by checkProof function!');
  console.log('8. txPrevProof correct!');
  logger.debug('============CHECK RLP=============');
  logger.debug('============txRpl=============');
  logger.debug(`HASH IN TR:`, callback(lastTx.hash));
  logger.debug(`FORMED IN TEST:`, callback(ethUtil.keccak(txRpl)));
  logger.debug('============txPrevRpl=============');
  logger.debug(`HASH IN TR:`, callback(prevTx.hash));
  logger.debug(`FORMED IN TEST:`, callback(ethUtil.keccak(txPrevRpl)));
  logger.debug('===============END================');
  logger.debug('FORMED MAIN PARAMS:', callback({blockNum, txRpl, txPrevRpl, txProof, txPrevProof, address}));

  const estimateGas = await contractHandler.estimateStartExit({blockNum, txRpl, txPrevRpl, txProof, txPrevProof, address});
  console.log('9. Estimated gas amount');
  logger.debug(estimateGas);
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
