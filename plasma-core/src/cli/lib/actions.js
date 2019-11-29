import {client} from "./plasma-client";
import * as Block from "../controllers/Block";
import * as Deposit from "../controllers/Deposit";
import * as Token from "../controllers/Token";
import * as Transaction from "../controllers/Transaction";
import * as Validator from "../controllers/Validator";

async function deposit({amount, wait, address, password}) {
  if (!address || !password) {
    console.log('Missing address or password. This options are required. Run "deposit --help" for more information.');
    process.exit(1);
  }
  if (!amount || isNaN(parseFloat(amount))) {
    console.log('Missing amount or bad value. Add -c or --amount option with number of deposit amount.');
    process.exit(1);
  }
  await Deposit.create(amount, wait, address, password);
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

      if (last) ignored.push('-l');
      if (token) ignored.push('-t');
      result = await Block.checkProof(hash, identifier, proof);
    } else if (proof) {
      if (!identifier || !token) {
        console.log('Missing options to get proof. Run "block --help" for more information.');
        process.exit(1);
      }

      if (last) ignored.push('-l');
      if (hash) ignored.push('-h');
      result = await Block.proof(token, identifier);
    } else {
      if (!identifier && !last) {
        console.log('Invalid set of options. Run "block --help" for more information.');
        process.exit(1);
      }

      if (token) ignored.push('-t');
      if (hash) ignored.push('-h');

      if (identifier) {
        if (last) ignored.push('-l');
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
        console.log('Missing data for search. Add "-i" option with token identifier or "-a" with token address to search some token.');
        process.exit(1);
      }
      if (last) ignored.push('-l');

      if (identifier) {
        if (address) ignored.push('-a');
        result = await Token.get(identifier);
      } else result = await Token.getByAddress(address);
    } else {
      if (!identifier) console.log('Missing option "-i". Run "token --help" for more information.');
      if (address) ignored.push('-a');

      if (!last) result = await Token.getTransactions(identifier);
      else result = await Token.getLastTransaction(identifier);
    }

    if (ignored.length) logIgnored(ignored, 'token');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

async function transaction({send, hash, address, pool, tokenId, password, type}) {
  let result, ignored = [];
  try {
    client();
    if (send) {
      if (!address || !password || !tokenId || !type) {
        console.log('Missing values to send transaction. Run "transaction --help" for more information.');
        process.exit(1);
      }

      if (hash) ignored.push('-h');
      if (pool) ignored.push('-l');

      result = await Transaction.send(address, password, tokenId, type);
    } else if (hash) {
      if (address) ignored.push('-a');
      if (pool) ignored.push('-l');
      if (tokenId) ignored.push('-i');
      if (password) ignored.push('-p');

      if (type) ignored.push('-t');
      result = await Transaction.get(hash);
    } else if (address) {
      if (pool) ignored.push('-l');
      if (tokenId) ignored.push('-i');
      if (password) ignored.push('-p');
      if (type) ignored.push('-t');

      result = await Transaction.getTransactionsByAddress(address);
    } else {
      if (!pool) {
        console.log('Invalid set of options.. Run "transaction --help" for more information.');
        process.exit(1);
      }

      if (tokenId) ignored.push('-i');
      if (password) ignored.push('-p');
      if (type) ignored.push('-t');

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
      if (validators) ignored.push('-v');
      if (current) ignored.push('-c');

      result = await Validator.getCandidates();
    } else if (validators) {
      if (current) ignored.push('-c');

      result = await Validator.getValidators();
    } else {
      if (!current) {
        console.log('Invalid set of options.. Run "transaction --help" for more information.');
        process.exit(1);
      }
      result = await Validator.getCurrent();
    }

    if (ignored.length) logIgnored(ignored, 'token');
    console.log(result);
  } catch (e) { console.log(e); }
  process.exit(1);
}

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
  deposit,
  block,
  token,
  transaction,
  validator
};

