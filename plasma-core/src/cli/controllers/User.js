import * as fs from 'fs';
import web3 from "../../root-chain/web3";

const PATH = __dirname + '/../credentials.json';

async function login(address, password) {
  await web3.eth.personal.unlockAccount(address, password, 1000);

  await fs.writeFileSync(PATH, `{"address": "${address}", "password": "${password}"}`);
  console.log('Login successful.');
}

module.exports = {
  login
};
