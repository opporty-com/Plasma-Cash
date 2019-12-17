import {client} from "./plasma-client";
import * as Block from "../controllers/Block";
import * as Deposit from "../controllers/Deposit";
import * as Token from "../controllers/Token";
import * as Transaction from "../controllers/Transaction";
import * as User from "../controllers/User";
import * as Validator from "../controllers/Validator";
import * as fs from 'fs';

// session validation before command's execution start
const PATH = __dirname + '/../credentials.json';
let credentials;
if (fs.existsSync(PATH)) {
  credentials = require(PATH);
  if (credentials && typeof credentials === 'object') {
    if (credentials.startedAt + credentials.time < Date.now())
      fs.unlinkSync(PATH);
  } else credentials = null;
}

const SHORTCUTS = {
  address: '-a',
  password: '-p',
  info: '-i',
  exit: '-e',
  amount: '-c',
  wait: '-w',
  identifier: '-i',
  last: '-l',
  token: '-t',
  proof: '-p',
  hash: '-h',
  check: '-c',
  transaction: '-t',
  send: '-s',
  pool: '-p',
  tokenId: '-i',
  type: '-t',
  candidates: '-c',
  validators: '-v',
  current: '-r',
  time: '-t'
};

async function auth({address, password, time, info, exit}) {
  let result, ignored = [];
  try {
    if (exit) {
      checkIgnored(ignored, {address, password, time});
      result = await User.exit(credentials, PATH);
    } else if (address && password) {
      if (time) {
        time = Number(time);
        if (time && !Number.isNaN(time) && Number.isInteger(time) && time > 0 && time < 1000000) time = time*1000;
        else {
          console.log('Invalid argument fot option "--time". Must be an integer, greater that 0 and less than 1,000,000.');
          process.exit(1);
        }
      } else time = 60*60*1000;
      result = await User.login(address, password, time, credentials, PATH);
    } else {
      if (!info) {
        console.log('Invalid set of options. Run "auth --help" for more information.');
        process.exit(1);
      }
    }
    if (ignored.length) logIgnored(ignored, 'auth');
    if (result) console.log(result);
    if (info) await User.info(PATH);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function deposit({amount, wait, address, password}) {
  try {
    if (!address || !password) {
      if (credentials) {
        console.log(`Using address and password from current session.`);
        address = credentials.address;
        password = credentials.password;
      } else {
        console.log('Missing address or password. This options are required (or you can log in instead). Run "deposit --help" for more information.');
        process.exit(1);
      }
    }
    if (!amount || isNaN(parseFloat(amount))) {
      console.log('Missing amount or bad value. Add -c or --amount option with number of deposit amount.');
      process.exit(1);
    }
    await Deposit.create(amount, wait, address, password);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function block({identifier, last, token, proof, hash, check}) {
  let result, ignored = [];
  try {
    client();
    if (check) {
      if (!proof || typeof proof !== 'string' || !hash || !identifier) {
        console.log('Missing options or values to check proof. Run "block --help" for more information.');
        process.exit(1);
      }

      checkIgnored(ignored, {last, token});
      result = await Block.checkProof(hash, identifier, proof);
    } else if (proof) {
      if (!identifier || !token) {
        console.log('Missing options to get proof. Run "block --help" for more information.');
        process.exit(1);
      }

      checkIgnored(ignored, {last, hash});
      result = await Block.proof(token, identifier);
    } else {
      if (!identifier && !last) {
        console.log('Invalid set of options. Run "block --help" for more information.');
        process.exit(1);
      }
      checkIgnored(ignored, {token, hash});

      if (identifier) {
        checkIgnored(ignored, {last});
        result = await Block.get(identifier);
      }
      else result = await Block.last();
    }

    if (ignored.length) logIgnored(ignored, 'block');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function token({identifier, address, transaction, last}) {
  let result, ignored = [];
  try {
    client();
    if (!transaction) {
      if (!identifier && !address) {
        if (credentials) {
          console.log(`Using address from current session.`);
          result = await Token.getByAddress(credentials.address);
        } else {
          console.log('Missing data for search. Add "-i" option with token identifier or "-a" with token address to search some token.');
          process.exit(1);
        }
      }
      checkIgnored(ignored, {last});

      if (identifier) {
        checkIgnored(ignored, {address});
        result = await Token.get(identifier);
      } else result = await Token.getByAddress(address);
    } else {
      if (!identifier) console.log('Missing option "-i". Run "token --help" for more information.');
      checkIgnored(ignored, {address});

      if (!last) result = await Token.getTransactions(identifier);
      else result = await Token.getLastTransaction(identifier);
    }

    if (ignored.length) logIgnored(ignored, 'token');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function transaction({send, hash, address, pool, tokenId, type, wait}) {
  let result, ignored = [];
  try {
    client();
    if (send) {
      if (!address || !tokenId || !type) {
        console.log('Missing values to send transaction. Run "transaction --help" for more information.');
        process.exit(1);
      }
      if (!credentials) {
        console.log('You must be logged in to send transactions. Use "auth --help" to check how to authenticate. Run "transaction --help" for more information.');
        process.exit(1);
      }
      checkIgnored(ignored, {hash, pool});
      console.log(`Using address and password from current session to sign transaction.`);
      result = await Transaction.send(address, tokenId, type, wait, credentials);
    } else if (hash) {
      checkIgnored(ignored, {address, pool, tokenId, type, wait});
      result = await Transaction.get(hash);
    } else if (address) {
      checkIgnored(ignored, {pool, tokenId, type, wait});
      result = await Transaction.getTransactionsByAddress(address);
    } else {
      if (!pool) {
        console.log('Invalid set of options. Run "transaction --help" for more information.');
        process.exit(1);
      }
      checkIgnored(ignored, {tokenId, type, wait});
      result = await Transaction.getPool();
    }
    if (ignored.length) logIgnored(ignored, 'token');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function validator({candidates, validators, current}) {
  let result, ignored = [];
  try {
    client();
    if (candidates) {
      checkIgnored(ignored, {validators, current});
      result = await Validator.getCandidates();
    } else if (validators) {
      checkIgnored(ignored, {current});
      result = await Validator.getValidators();
    } else {
      if (!current) {
        console.log('Invalid set of options. Run "transaction --help" for more information.');
        process.exit(1);
      }
      result = await Validator.getCurrent();
    }

    if (ignored.length) logIgnored(ignored, 'token');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

const checkIgnored = (array, opts) => {
  const keys = Object.keys(opts);
  keys.forEach(key => {
    if (opts[key]) array.push(SHORTCUTS[key]);
    return true;
  });
  return true;
};

const logIgnored = (opts, command) => {
  let res = 'Option', verb = 'was';
  if (opts.length > 1) {
    res += 's';
    verb = 'were';
  }
  opts.forEach(o => res += ` "${o}",`);
  res = res.slice(0, res.length - 1);
  res += ` ${verb} ignored. Run "${command} --help" for more information.`;
  return console.log(res);
};

module.exports = {
  auth,
  deposit,
  block,
  token,
  transaction,
  validator
};
