import chai from 'chai';
import chai_things from 'chai-things';
import { promise as plasma, client } from "../src/api/lib/plasma-client";
import contractHandler from '../src/root-chain/contracts/plasma';
import web3  from '../src/root-chain/web3';
import * as Token from "../src/api/helpers/Token";
import logger from "../src/child-chain/lib/logger";

const { expect } = chai;
const ACCOUNT = {
  address: '0x5F37D668c180584C99eeb3181F2548E66524663b',
  password: '123456',
  privateKey: '75c531a112aa02134615bb9e481d984b5aea4159f7ef28f100a8530ba7b96cc5',
  amount: 100000000 //pow(10, 8), 0.0000000001 Ether
};
const MAX_COUNTER = 50;
const INTERVAL = 5000;

chai.should();
chai.use(chai_things);

describe("CREATING DEPOSIT", () => {
  it(`Should create deposit by address ${ACCOUNT.address}`, async () => {
    await web3.eth.personal.unlockAccount(ACCOUNT.address, ACCOUNT.password, 1000);
    console.log(`1. Account ${ACCOUNT.address} unlocked`);

    const gas = await contractHandler.estimateCreateDepositkGas(ACCOUNT.address);
    console.log("2. Gas amount received");
    logger.debug(gas);

    expect(gas).to.be.a('number');

    const tokenId = await contractHandler.createDeposit({ from: ACCOUNT.address, value: ACCOUNT.amount, gas: gas + 150000 });
    console.log("3. Token ID received");
    logger.debug(tokenId);

    expect(tokenId).to.be.string;

    console.log(`4. Trying to get same token from plasma (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
    client();
    let result;
    await new Promise(resolve => {
      let counter = 0;
      const interval = setInterval(async () => {
        counter++;
        let logStr = `Attempt number ${counter}, time left: ~${counter*5}s. `;
        const data = await plasma({action: "getToken", payload: {tokenId}})
          .catch(e => {
            logStr += `Answered with error: ${e}. `;
            return null;
          });

        if (data) {
          result = Token.getJson(data);
          logStr += `Result: Token has been found! Data:`;
        } else logStr += 'Result: No data received...';
        console.log(logStr); if (result) console.log(result);

        if ((result && result.id) || counter === MAX_COUNTER) {
          expect(result).to.be.an('object');
          expect(result.id).to.be.string;
          clearInterval(interval);
          resolve(true);
        }
      }, INTERVAL);
    });
    if (!(result && result.id)) throw new Error(`Token (ID: ${tokenId}) was not found in plasma network!`);
  });
});

after(() => setTimeout(() => process.exit(200), 1000));
