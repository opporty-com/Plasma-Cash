import chai from 'chai';
import chai_things from 'chai-things';
import BN from 'bn.js'
import * as RLP from 'rlp'
import web3 from "../src/root-chain/web3";
import * as ethUtil from "ethereumjs-util";
import {client, promise as plasma} from "../src/api/lib/plasma-client";
import logger from "../src/child-chain/lib/logger";
import * as Token from "../src/api/helpers/Token";

const { expect } = chai;
const ACCOUNTS = [
  {
    address: '0x5F37D668c180584C99eeb3181F2548E66524663b',
    password: '123456',
    privateKey: '75c531a112aa02134615bb9e481d984b5aea4159f7ef28f100a8530ba7b96cc5'
  }, {
    address: '0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417',
    password: '123456',
    privateKey: 'a9f0374e8bbe95682d3a4230068b631223c81b985a782c2d71ace7eb0a679122'
  }
];
const INTERVAL = 5000;
const MAX_COUNTER = 50;
const callback = data => process.env.LOG_LEVEL === 'debug' ? console.log(data) : null;

chai.should();
chai.use(chai_things);

describe("CHANGING OWNER", () => {
  it(`Should change token owner: from ${ACCOUNTS[0].address} to ${ACCOUNTS[1].address}`, async () => {
    const oldAcc = ACCOUNTS[0];
    const newAcc = ACCOUNTS[1];
    await web3.eth.personal.unlockAccount(oldAcc.address, oldAcc.password, 1000);
    console.log(`1. Account ${oldAcc.address} unlocked`);

    client();
    const answer = await plasma({action: "getTokenByAddress", payload: {address: Buffer.from(ethUtil.stripHexPrefix(oldAcc.address), 'hex')}});
    console.log(`2. Got answer for "getTokenByAddress" and address ${oldAcc.address}`);
    logger.debug(answer);

    expect(answer).to.be.an('object');
    expect(answer.tokens).to.be.an('array').that.is.not.empty;

    const index = answer.tokens.findIndex(t => t.status === 1);
    if (index === -1) throw new Error(`No active tokens by address ${oldAcc.address}`);
    const token = answer.tokens[index];
    logger.debug(`====> Token to use for test changing: ${token.id}`);
    expect(token.id).to.be.string;

    const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId: token.id}});
    console.log(`3. Got last transaction of ${oldAcc.address} by token ${token.id}`);
    logger.debug(lastTx);

    expect(lastTx).to.be.an('object');
    expect(lastTx.tokenId).to.be.string;
    expect(lastTx.blockNumber).to.be.a('number');

    const fee = 1;
    const data = {
      prevHash: lastTx.hash,
      prevBlock: lastTx.blockNumber,
      tokenId: token.id,
      type: 1, // pay
      totalFee: (parseInt(lastTx.totalFee) + fee).toString(),
      fee: fee.toString(),
      newOwner: Buffer.from(ethUtil.stripHexPrefix(newAcc.address), 'hex'),
      dataLength: 0,
      data: Buffer.from(''),
      blockNumber: 0,
      timestamp: (new Date()).getTime()
    };
    console.log('4. Formed data for transaction');
    logger.debug(data);

    let dataToEncode = [
      data.prevHash,
      data.prevBlock,
      new BN(data.tokenId),
      data.newOwner,
      data.type,
      new BN(data.totalFee),
      new BN(data.fee),
      data.data,
    ];
    console.log('5. Formed data to encode');
    logger.debug(dataToEncode);

    const hash = ethUtil.keccak(RLP.encode(dataToEncode));
    logger.debug('====> Encoded data:', callback(hash));

    const msgHash = ethUtil.hashPersonalMessage(hash);
    const key = Buffer.from(oldAcc.privateKey, 'hex');
    const sig = ethUtil.ecsign(msgHash, key);

    data.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s));
    dataToEncode.push(data.signature);
    logger.debug('====> New data to encode:', callback(dataToEncode));
    data.hash = ethUtil.keccak(RLP.encode(dataToEncode));
    logger.debug('====> Hash in transaction:', callback(data.hash));

    const sentTx = await plasma({action: "sendTransaction", payload: data});
    console.log('6. Transaction has been sent');
    logger.debug('', sentTx);
    expect(ethUtil.addHexPrefix(sentTx.newOwner.toString('hex').toLowerCase())).to.be.equal(newAcc.address.toLowerCase());

    console.log(`7. Waiting until token's owner change (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
    let result;
    await new Promise(resolve => {
      let counter = 0;
      const interval = setInterval(async () => {
        counter++;
        let logStr = `Attempt number ${counter}, time left: ~${counter*5}s. `;
        const data = await plasma({action: "getToken", payload: {tokenId: token.id}})
          .catch(e => {
            logStr += `Answered with error: ${e}. `;
            return null;
          });
        const owner = ethUtil.addHexPrefix(data.owner.toString('hex'));
        logStr += `Current token owner: ${owner}, `;

        if (owner.toLowerCase() === newAcc.address.toLowerCase()) {
          result = true;
          logStr += 'HAS CHANGED! Current token state:';
        } else logStr += 'has not changed...';
        console.log(logStr); if (result) console.log(Token.getJson(data));

        if (result || counter === MAX_COUNTER) {
          clearInterval(interval);
          resolve(true);
        }
      }, INTERVAL);
    });
    if (!result) throw new Error('The owner has not changed!');
  });
});

after(() => setTimeout(() => process.exit(200), 1000));
