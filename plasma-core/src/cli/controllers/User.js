import * as fs from 'fs';
import web3 from "../../root-chain/web3";

async function login(address, password, time, credentials, PATH) {
  const isUnlocked = await web3.eth.personal.unlockAccount(address, password, 1000);
  if (!isUnlocked) return 'Login failed.';

  if (credentials) return 'Found active session. You must end the session to create new one. Use "auth -i" to see info.';
  await fs.writeFileSync(PATH, `{"address": "${address}", "password": "${password}", "time": ${time}, "startedAt": ${Date.now()}}`);
  if (fs.existsSync(PATH)) return 'Login successful.';
  return 'Login failed.';
}

async function exit(credentials, PATH) {
  if (credentials) {
    fs.unlinkSync(PATH);
    return 'Successfully logged out.';
  }
  return 'No active sessions.';
}

async function info(PATH) {
  if (fs.existsSync(PATH)) {
    const credentials = require(PATH);
    if (credentials && typeof credentials === 'object') {
      const endsAt = credentials.startedAt + credentials.time;
      const now = Date.now();
      console.log(`Now the user's ${credentials.address} session is active. Will be valid for ${Math.ceil((endsAt - now)/1000/60)} minute(s).`);
    } else console.log('No active sessions.');
  } else console.log('No active sessions.');
  return true;
}


module.exports = {
  login,
  exit,
  info
};
