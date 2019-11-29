import {client, promise as plasma} from "../lib/plasma-client";
import web3 from '../../root-chain/web3';
import contractHandler from '../../root-chain/contracts/plasma';
import * as Token from '../helpers/Token'

const MAX_COUNTER = 50;
const INTERVAL = 5000;

async function create(amount, wait, address, password) {
  await web3.eth.personal.unlockAccount(address, password, 1000);
  console.log(`1. Account ${address} unlocked.`);

  const gas = await contractHandler.estimateCreateDepositkGas(address);
  console.log("2. Gas amount received.");

  console.log("3. Creating deposit...");
  const tokenId = await contractHandler.createDeposit({from: address, value: amount, gas: gas + 150000});
  console.log("4. Token ID received.");
  if (wait) {
    console.log(`5. Trying to get same token from plasma (${MAX_COUNTER} number of attempts, one by one each ${INTERVAL/1000}s):`);
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
        console.log(logStr); if (result) console.log('Result:', result);

        if ((result && result.id) || counter === MAX_COUNTER) {
          clearInterval(interval);
          resolve(true);
        }
      }, INTERVAL);
    });
    if (!(result && result.id)) console.log(`Token (ID: ${tokenId}) was not found in plasma network!`);
  } else console.log('Result:', {tokenId, amount});
  process.exit(1);
}

module.exports = {
  create
};
