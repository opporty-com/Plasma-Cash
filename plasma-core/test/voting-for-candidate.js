import chai from 'chai';
import chai_things from 'chai-things';
import BN from 'bn.js'
import * as RLP from 'rlp'
import web3 from "../src/root-chain/web3";
import * as ethUtil from "ethereumjs-util";
import {client, promise as plasma} from "../src/api/lib/plasma-client";
import contractHandler from '../src/root-chain/contracts/plasma';
import * as Token from "../src/api/helpers/Token";
import logger from "../src/child-chain/lib/logger";

const { expect } = chai;
const ACCOUNTS = [
  {
    address: '0x5F37D668c180584C99eeb3181F2548E66524663b',
    password: '123456',
    privateKey: '75c531a112aa02134615bb9e481d984b5aea4159f7ef28f100a8530ba7b96cc5',
    amount: 100000000 //pow(10, 8), 0.0000000001 Ether
  }, {
    address: '0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417',
    password: '123456',
    privateKey: 'a9f0374e8bbe95682d3a4230068b631223c81b985a782c2d71ace7eb0a679122',
    amount: 100000000 //pow(10, 8), 0.0000001 Ether
  }
];
const MAX_COUNTER = 50;
const INTERVAL = 5000;
const CANDIDATE_COUNT_VOTES = 5;
const VOTER_DEPOSITS_NUMBER = CANDIDATE_COUNT_VOTES + 2;
const callback = data => process.env.LOG_LEVEL === 'debug' ? console.log(data) : null;

chai.should();
chai.use(chai_things);

describe("VOTING FOR CANDIDATE", () => {
  it(`Should add as candidate ${ACCOUNTS[0].address} and vote for him ${CANDIDATE_COUNT_VOTES} times from ${ACCOUNTS[1].address}`, async () => {
    const candidate = ACCOUNTS[0];
    const voter = ACCOUNTS[1];
    const res = await new Promise(async () => {
      console.log('***START***');
      console.log('0. Current number of votes to be an operator:', CANDIDATE_COUNT_VOTES);

      await web3.eth.personal.unlockAccount(candidate.address, candidate.password, 1000);
      await web3.eth.personal.unlockAccount(voter.address, voter.password, 1000);
      console.log(`1. Accounts ${candidate.address} and ${voter.address} unlocked`);

      client();
      console.log(`2. Creating 1 deposit for future candidate ${candidate.address}`);
      const candidateToken = await createDeposit(candidate);

      console.log(`3. Creating transaction to make ${candidate.address} candidate`);
      await makeCandidate(candidate, candidateToken);
      console.log(`====> Now, ${candidate.address} is a candidate!`);

      console.log(`4. Creating ${VOTER_DEPOSITS_NUMBER} number of deposits for voter ${voter.address}`);
      const startDeposits = Date.now();
      let promisesForDeposits = [];
      for (let i = 0; i < VOTER_DEPOSITS_NUMBER; i++) {
        promisesForDeposits.push(createDeposit(voter));
      }
      const voterTokens = await Promise.all(promisesForDeposits);
      console.log(`====> All deposits created, finished in ${(Date.now() - startDeposits)/1000}s.`);

      console.log(`5. Voting ${CANDIDATE_COUNT_VOTES} times from ${voter.address} for ${candidate.address}`);
      const startVoting = Date.now();
      let promisesForVoting = [];
      for (let i = 0; i < CANDIDATE_COUNT_VOTES; i++) {
        promisesForVoting.push(vote(candidate, voter, voterTokens[i]));
      }
      const voteTransactions = await Promise.all(promisesForVoting);
      logger.debug('====> Vote transactions:', callback(voteTransactions));
      console.log(`====> All votes were sent, finished in ${(Date.now() - startVoting)/1000}s.`);

      console.log(`6. Waiting, until the account ${candidate.address} will have enough votes to be an operator (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
      let result;
      new Promise(() => {
        let counter = 0;
        const interval = setInterval(async () => {
          counter++;
          console.log(`Attempt number ${counter}, time left: ~${counter*5}s.`);
          const data = await plasma({action: "getCandidates", payload: {}})
            .catch(e => console.log('Error:', e));
          if (data) {
            let {candidates} = data; candidates = candidates||[];
            console.log('Current candidates number:', candidates.length);

            if (candidates.length) {
              const ourCandidateIndex = candidates.findIndex(can => ethUtil.addHexPrefix(can.address.toLowerCase()) === candidate.address.toLowerCase());
              if (ourCandidateIndex !== -1) {
                const votes = candidates[ourCandidateIndex].votes;
                console.log("Our candidate's votes:", votes);
                if (votes === CANDIDATE_COUNT_VOTES) {
                  console.log("That's enough to be an operator!");
                  result = candidates[ourCandidateIndex];
                }
              }
            }
          } else console.log('No data received...');
          if (result || counter === MAX_COUNTER) {
            clearInterval(interval);
            if (!result) throw new Error(`Our candidate ${candidate.address} still does not have enough votes!`);
          }
          console.log('===========================================');
        }, INTERVAL);
      });
      console.log('Subscribe to the event "OperatorAdded"...');
      return await contractHandler.events.OperatorAdded.returnValues;
    });
    if (!res) throw new Error(`Our candidate ${candidate.address} still doesn't became a candidate!`);
    console.log(`====> Now, our candidate ${candidate.address} is an OPERATOR!`);
    logger.debug('Result:', callback(res));
    console.log('***END***');
    return true;
  })
});

after(() => setTimeout(() => process.exit(200), 1000));


//console.log's only for candidate because of big number of deposits for voter!
const createDeposit = async account => {
  await web3.eth.personal.unlockAccount(account.address, account.password, 1000);
  const gas = await contractHandler.estimateCreateDepositkGas(account.address);
  if (isCandidateAcc(account)) {
    console.log("====> Gas amount received");
    logger.debug(gas);
  }

  expect(gas).to.be.a('number');

  const tokenId = await contractHandler.createDeposit({ from: account.address, value: account.amount, gas: gas + 150000 });
  if (isCandidateAcc(account)) {
    console.log("====> Token ID received");
    logger.debug(tokenId);
  }

  expect(tokenId).to.be.string;

  if (isCandidateAcc(account))
    console.log(`====> Trying to get same token from plasma (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
  client();
  let result;
  await new Promise(resolve => {
    let counter = 0;
    const interval = setInterval(async () => {
      counter++;
      if (isCandidateAcc(account)) console.log(`Attempt number ${counter}, time left: ~${counter*5}s.`);
      const data = await plasma({action: "getToken", payload: {tokenId}})
        .catch(e => {
          if (isCandidateAcc(account)) console.log('Error:', e);
          return null;
        });

      if (data)
        result = Token.getJson(data);

      if (isCandidateAcc(account)) {
        if (data) {
          console.log('Token has been found! Result:', result);
        } else console.log('No data received...');
        console.log('===========================================');
      }

      if ((result && result.id) || counter === MAX_COUNTER) {
        expect(result).to.be.an('object');
        expect(result.id).to.be.string;
        clearInterval(interval);
        resolve(true);
      }
    }, INTERVAL);
  });
  if (!(result && result.id)) throw new Error(`Token (ID: ${tokenId}) was not found in plasma network!`);
  console.log(`====> Deposit has been created, token ID: ${tokenId}`);
  return result;
};

const isCandidateAcc = account => account.address === ACCOUNTS[0].address;

const makeCandidate = async (account, token) => {
  await web3.eth.personal.unlockAccount(account.address, account.password, 1000);
  logger.debug('====> Token to use for making candidate:', callback(token.id));

  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId: token.id}});
  logger.debug(`====> Got last transaction of ${account.address} by token ${token.id}:`, callback(lastTx));

  expect(lastTx).to.be.an('object');
  expect(lastTx.tokenId).to.be.string;
  expect(lastTx.blockNumber).to.be.a('number');

  const fee = 1;
  const data = {
    prevHash: lastTx.hash,
    prevBlock: lastTx.blockNumber,
    tokenId: token.id,
    type: 4, // candidate
    totalFee: (parseInt(lastTx.totalFee) + fee).toString(),
    fee: fee.toString(),
    newOwner: Buffer.from(ethUtil.stripHexPrefix(account.address), 'hex'),
    dataLength: 0,
    data: Buffer.from(''),
    blockNumber: 0,
    timestamp: (new Date()).getTime()
  };
  logger.debug('====> Formed data for transaction', callback(data));

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
  logger.debug('====> Formed data to encode', callback(dataToEncode));

  const hash = ethUtil.keccak(RLP.encode(dataToEncode));
  logger.debug('====> Data encoded', callback(hash));

  const msgHash = ethUtil.hashPersonalMessage(hash);
  const key = Buffer.from(account.privateKey, 'hex');
  const sig = ethUtil.ecsign(msgHash, key);

  data.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s));
  dataToEncode.push(data.signature);
  logger.debug('====> Formed new data to encode', callback(dataToEncode));

  data.hash = ethUtil.keccak(RLP.encode(dataToEncode));
  logger.debug('====> Formed hash in transaction', callback(data.hash));

  const sentTx = await plasma({action: "sendTransaction", payload: data});
  logger.debug('====> Transaction has been sent', callback(sentTx));
  expect(ethUtil.addHexPrefix(sentTx.newOwner.toString('hex').toLowerCase())).to.be.equal(account.address.toLowerCase());

  console.log(`====> Waiting, until the account ${account.address} becomes a candidate (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
  let result;
  await new Promise(resolve => {
    let counter = 0;
    const interval = setInterval(async () => {
      counter++;
      console.log(`Attempt number ${counter}, time left: ~${counter*5}s.`);
      const data = await plasma({action: "getCandidates", payload: {}})
        .catch(e => console.log('Error:', e));
      if (data) {
        let {candidates} = data; candidates = candidates||[];
        console.log('Current candidates number:', candidates.length);

        if (candidates.length) {
          // console.log('CANDIDATES:', candidates);
          const ourCandidateIndex = candidates.findIndex(can => ethUtil.addHexPrefix(can.address.toLowerCase()) === account.address.toLowerCase());
          if (ourCandidateIndex !== -1) {
            result = candidates[ourCandidateIndex];
            console.log('Our candidate was found! Result:', result);
          }
        }
      } else console.log('No data received...');

      if (result || counter === MAX_COUNTER) {
        clearInterval(interval);
        resolve(true);
      }
      console.log('===========================================');
    }, INTERVAL);
  });
  if (!result) throw new Error('Candidate was not found!');
};

const vote = async (candidate, voter, token) => {
  await web3.eth.personal.unlockAccount(candidate.address, candidate.password, 1000);
  await web3.eth.personal.unlockAccount(voter.address, voter.password, 1000);
  logger.debug('====> Tokens ID to vote:', callback(token.id));

  const lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId: token.id}});
  expect(lastTx).to.be.an('object');
  expect(lastTx.tokenId).to.be.string;
  expect(lastTx.blockNumber).to.be.a('number');

  const fee = 1;
  const data = {
    prevHash: lastTx.hash,
    prevBlock: lastTx.blockNumber,
    tokenId: token.id,
    type: 4, // candidate
    totalFee: (parseInt(lastTx.totalFee) + fee).toString(),
    fee: fee.toString(),
    newOwner: Buffer.from(ethUtil.stripHexPrefix(candidate.address), 'hex'),
    dataLength: 0,
    data: Buffer.from(''),
    blockNumber: 0,
    timestamp: (new Date()).getTime()
  };

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

  const hash = ethUtil.keccak(RLP.encode(dataToEncode));
  const msgHash = ethUtil.hashPersonalMessage(hash);
  const key = Buffer.from(voter.privateKey, 'hex');
  const sig = ethUtil.ecsign(msgHash, key);

  data.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s));
  dataToEncode.push(data.signature);
  data.hash = ethUtil.keccak(RLP.encode(dataToEncode));

  const sentTx = await plasma({action: "sendTransaction", payload: data});
  expect(ethUtil.addHexPrefix(sentTx.newOwner.toString('hex').toLowerCase())).to.be.equal(candidate.address.toLowerCase());
  logger.debug('====> Transaction has been sent!');
};
