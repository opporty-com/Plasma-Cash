import web3 from "../root-chain/web3";
import * as RLP from 'rlp'
import BN from 'bn.js'
import plasmaContract from "../root-chain/contracts/plasma";
import {promise as plasma, client as plasmaClient} from "./plasma-client";
import * as ethUtil from "ethereumjs-util";

import BD from 'binary-data';
import config from "../config";

import {Transaction as TransactionProtocol} from '../schemas/model-protocols';

plasmaClient();
const colors = {
  bold: 1,
  italic: 3,
  underline: 4,
  inverse: 7,
  white: 37,
  grey: 90,
  black: 30,
  blue: 34,
  cyan: 36,
  crimson: 38,
  green: 32,
  magenta: 35,
  red: 31,
  yellow: 33,
};
const balanceTimeout = 60000;
const sumEth = 0.001;
const datadir = "/root/.ethereum/devnet";
const defaultPassword = "123456";
const nodes = [
  {
    address: "0x1CAd72F28B34141dB68D37f43b18d5e120c51f2A",
    password: "123123123",
    privateKey: "f98419bc1f1ad0bc2dce35ac183986c593d022dfaf0193bbe03372075acc42d8"
  },
  {
    address: "0x76ed0955af5c39a8122e5069c6a0a4cc129a11ef",
    password: "123123123",
    privateKey: "44e5d898b001f7910c7f21ac097c5bfe164b6af875b36218c0c69268b0cb0d0c"
  },
  {
    address: "0x4309d070cdc587fec998426a34002371cec24a69",
    password: "123123123",
    privateKey: "68023ed09a6512cb02a1a3d8c0fd1c9424c85d6be9004286a5439c69f65d3047"
  }

];

// let addresses = [];

let addresses = [
  {
    address: "0x5F37D668c180584C99eeb3181F2548E66524663b",
    password: defaultPassword,
    privateKey: '75c531a112aa02134615bb9e481d984b5aea4159f7ef28f100a8530ba7b96cc5'
  }, {
    address: "0xa1E8e10AC00964CC2658E7dc3E1A017f0BB3D417",
    password: defaultPassword,
    privateKey: 'a9f0374e8bbe95682d3a4230068b631223c81b985a782c2d71ace7eb0a679122'
  }, {
    address: "0xF8536D809bF1064ac92abd5c3e64b84287C15b3D",
    password: defaultPassword,
    privateKey: 'fe5e915225a7f6da14461c74c847b53e4b2d064219f57d9e68f00b9df4875c51'
  }, {
    address: "0x9FaAA5C2a9b4e4C2Adb2cb91470023daA399cB05",
    password: defaultPassword,
    privateKey: 'e47b16e9c04ac88941c4a10db9c471c20b7808e9bfa8b653884f48fa979fc59d'
  }, {
    address: "0x535D24D047A725a6A215557fce50FE3313E6fF1c",
    password: defaultPassword,
    privateKey: '171195e014000efeb471f3bf77653d6f96b3099e843f186ec370f833255f3b92'
  }, {
    address: "0x9128a9C77c363351aB66a1fe547028e2FC330B53",
    password: defaultPassword,
    privateKey: '95b226c1f10198eb8a564d2c2be61ca399643f3044a04acf24501108c50c0ade'
  }, {
    address: "0x01517Ad0b546dD976b16E0787115ea4Cc265B74a",
    password: defaultPassword,
    privateKey: '6a653419e85f6ba1d97a0256660778a94344f890047f7d44e2b74978c21d7790'
  }, {
    address: "0x07B159F68ef75691987edA3f63911372d7D1B06c",
    password: defaultPassword,
    privateKey: '3f77d8b07a108f95fbef09a5b1ba3c6b9e36ea169d33d69eea43361cb75c3ae7'
  }, {
    address: "0xc017eFa942bF70Cfbb700318aEF3e2Bc30C0c6b3",
    password: defaultPassword,
    privateKey: 'a665de23235461a80ed452320c72f786905bfc899aff11b1ad33bf6fe83955bd'
  }, {
    address: "0xfd0A77075115C20b41B5F29646d76D52Fb23Aef8",
    password: defaultPassword,
    privateKey: '6a6577032c8cf470bc25bd50a79e555d955af0e9c065f1f3cca4ff39b25df8d1'
  }
];


let tokens = {};

async function checkETHBalances() {
  for (let node of nodes) {
    const balance = await web3.eth.getBalance(node.address);
    log(`${node.address}: \tbalance: ${web3.utils.fromWei(balance, "ether")} ether`, colors.cyan);
  }
  for (let account of addresses) {
    const balance = await web3.eth.getBalance(account.address);
    log(`${account.address}: \tbalance: ${web3.utils.fromWei(balance, "ether")} ether`, colors.cyan);
  }
}


async function createAccount(count = 6, password = true) {
  log("Start create test account", colors.crimson);

  for (let i = 0; i < count; i++) {
    let address;
    if (password) {
      address = await web3.eth.personal.newAccount(defaultPassword);
      addresses.push({
        address,
        password: defaultPassword,
      });
    } else {

      const result = await web3.eth.accounts.create();
      address = result.address;
      addresses.push({
        address,
        privateKey: result.privateKey,
      });
    }
    log(`Account ${address} has been added`, colors.crimson);
  }

  log("End create test account", colors.crimson);
}


async function sendEth() {
  log(`Start send ${sumEth} ether to test account`, colors.yellow);
  const {address: from, password} = nodes[0];
  await web3.eth.personal.unlockAccount(from, password);
  const promises = addresses.map(({address: to}) => {
    return web3.eth.sendTransaction({
      from,
      to,
      value: web3.utils.toWei(`${sumEth}`, "ether"),
      gas: 21000
    }).then(res => {
      log(`${sumEth} ether has been sent from ${from} to address ${to}`, colors.yellow);
    })
  });
  await Promise.all(promises);
  log(`End send ${sumEth} ether to test account`, colors.yellow);
}

async function sendEthNodes() {
  log(`Start send ${sumEth} ether to test nodes`, colors.yellow);
  const {address: from, password} = nodes[0];
  await web3.eth.personal.unlockAccount(from, password);
  const promises = nodes.map(({address: to}) => {
    if (to === from) return;
    return web3.eth.sendTransaction({
      from,
      to,
      value: web3.utils.toWei(`${sumEth}`, "ether"),
      gas: 21000
    }).then(res => {
      log(`${sumEth} ether has been sent from ${from} to address ${to}`, colors.yellow);
    })
  });
  await Promise.all(promises);
  log(`End send ${sumEth} ether to test account`, colors.yellow);
}


async function depositNodes(countPerAddress = 1) {
  log("Start deposit from nodes", colors.blue);

  let promises = [];
  for (let account of nodes) {

    const {address, password} = account;


    for (let i = 0; i < countPerAddress; i++) {
      promises.push(new Promise(async (resolve) => {
          await web3.eth.personal.unlockAccount(address, password, 100000);
          let gas = await plasmaContract.estimateCreateDepositkGas(address);
          const tokenId = await plasmaContract.createDeposit({from: address, value: 1, gas: gas + 150000});
          tokens[tokenId] = {tokenId, address};
          log(`Token ${tokenId} has been added for ${address}`, colors.blue);
          resolve(tokens[tokenId])
        }
      ));
    }
  }

  await Promise.all(promises);
  log("finish deposit from nodes", colors.blue);
}


async function _getToken(address, resolve) {
  let data = await plasma({
    action: "getTokenByAddress",
    payload: {address: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),}
  });
  if (data.count > 0)
    return resolve(data.tokens[0].id);

  setTimeout(() => _getToken(address, resolve), 1000);
}

function getToken(address) {
  return new Promise(async resolve => {
    await _getToken(address, resolve);
  })
}

async function addCandidate() {
  for (let account of nodes) {
    const {address, password, privateKey} = account;

    await web3.eth.personal.unlockAccount(address, password);
    const tokenId = await getToken(address);


    let lastTx = await plasma({action: "getLastTransactionByTokenId", payload: {tokenId}});

    const data = {
      prevHash: lastTx.hash,
      prevBlock: lastTx.blockNumber,
      tokenId,
      type: 4,
      totalFee: "1",
      fee: "1",
      newOwner: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),
      dataLength: 0,
      data: Buffer.from(''),
      blockNumber: 0,
      timestamp: (new Date()).getTime()
    };


    const dataToEncode = [
      data.prevHash,
      data.prevBlock,
      new BN(data.tokenId),
      data.newOwner,
      data.type,
      data.data,
    ];

    data.hash = ethUtil.keccak(RLP.encode(dataToEncode));


    let msgHash = ethUtil.hashPersonalMessage(data.hash);
    let key = Buffer.from(privateKey, 'hex');
    let sig = ethUtil.ecsign(msgHash, key);
    data.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s));

    await plasma({action: "sendTransaction", payload: data});
    log(`Send candidate from  address ${address}`, colors.blue);
  }


}

async function deposit(countPerAddress = 1, useEth = true) {
  log("Start deposit from test address", colors.blue);

  let transactions = [];


  log(`Create deposit ${addresses.length * countPerAddress} transactions`, colors.blue);
  for (let account of addresses) {
    const {address, password, privateKey} = account;

    await web3.eth.personal.unlockAccount(address, password);

    const rand = Math.random().toString().substring(2);
    for (let i = 0; i < countPerAddress; i++) {
      const tokenId = rand + i;
      const data = {
        prevHash: Buffer.from(ethUtil.stripHexPrefix(address+"AAAAAAAAAAAAAAAAAAAAAAAA"), 'hex'),
        prevBlock: 0,
        tokenId,
        type: 1,
        totalFee: "1",
        fee: "1",
        newOwner: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),
        dataLength: 0,
        data: Buffer.from(''),
        blockNumber: 0,
        timestamp: (new Date()).getTime()
      };


      const dataToEncode = [
        data.prevHash,
        data.prevBlock,
        new BN(data.tokenId),
        data.newOwner,
        data.type,
        data.data,
      ];

      data.hash = ethUtil.keccak(RLP.encode(dataToEncode));


      let msgHash = ethUtil.hashPersonalMessage(data.hash);
      let key = Buffer.from(privateKey, 'hex');
      let sig = ethUtil.ecsign(msgHash, key);
      data.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s))


      // const {signature} = web3.eth.accounts.sign(ethUtil.addHexPrefix(data.hash.toString('hex')), privateKey);
      // data.signature = ethUtil.toBuffer(signature);


      // data.signature = ethUtil.toBuffer(await web3.eth.sign(ethUtil.addHexPrefix(data.hash.toString('hex')), address));


      // const packet = BD.encode(data, TransactionProtocol);
      // transactions.push(packet.slice());
      transactions.push(data);

      // if(transactions.length % 1000 === 0)
      //   log(`${transactions.length} transactions have been created`, colors.blue);
    }
    log(`${transactions.length} transactions have been created`, colors.blue);
  }

  log(`${transactions.length} deposit transaction have been created`, colors.blue);

  log(`Send ${transactions.length} deposits`, colors.blue);

  let i = -1;

  const start = new Date();

  async function send() {
    i++;
    if (i >= transactions.length) return Promise.resolve();
    await plasma({action: "sendTransaction", payload: transactions[i]});
    await send();
  }


  await Promise.all((Array(Math.min(transactions.length, 10000))).fill(0).map(async i => await send()));

  const end = new Date();

  log(`Deposit ${transactions.length} tokens for ${(end.getTime() - start.getTime()) / 1000} sec. ~ ${transactions.length / ((end.getTime() - start.getTime()) / 1000)} transactions per sec`, colors.blue);

  log(`End ${countPerAddress * addresses.length} deposit from test address`, colors.blue);
}


async function getAccountTokenBalance(set = false) {
  const promises = addresses.map(async ({address}) => {
    const res = await plasma({action: "getTokenByAddress", payload: address});
    log(`Balance for ${address}`, colors.green);
    console.log(res);
    if (set) {
      res.forEach((tokenId, address) => {
        tokens[tokenId] = {tokenId, address};
      })
    }
  });
  return await Promise.all(promises);
}

async function checkTokenBalances(set = false) {
  log(`Start checking token balance after ${balanceTimeout / 1000} sec`, colors.green);

  await new Promise(async (resolve, reject) => {
    try {
      setTimeout(async () => {
        await getAccountTokenBalance();
        resolve();
      }, balanceTimeout);
    } catch (e) {
      console.log(e);
      reject(e)
    }
  });


  log("End checking token balance", colors.green);
}


function _sign(hash, pk) {
  let msgHash = ethUtil.hashPersonalMessage(hash);
  let key = Buffer.from(pk, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
}

const lastTxs = {}


async function getTransactionData({tokenId, to, privateKey, data = ''}) {

  if (!lastTxs[tokenId]) {
    lastTxs[tokenId] = await plasma({action: "getLastTransactionByTokenId", payload: tokenId});
  }
  const lastTx = lastTxs[tokenId];

  const txData = {
    prevHash: lastTx.hash,
    prevBlock: lastTx.blockNumber,
    tokenId,
    type: 'pay',
    data,
    newOwner: to,
  };

  const dataToEncode = [
    ethUtil.toBuffer(lastTx.hash),
    ethUtil.toBuffer(lastTx.blockNumber),
    ethUtil.toBuffer(ethUtil.stripHexPrefix(tokenId)),
    ethUtil.toBuffer(to),
    ethUtil.toBuffer('pay'),
    ethUtil.toBuffer('')
  ];


  const rlp = RLP.encode(dataToEncode);
  const hash = ethUtil.sha3(rlp);
  txData.signature = _sign(hash, privateKey);

  return txData;

}


async function sendTransactions() {
  log("Start send Transactions", colors.red);


  const promises = Object.values(tokens).map(async ({address, tokenId}) => {
    // const {address, tokenId} = Object.values(tokens)[0];
    const {address: to} = addresses.filter(a => a.address !== address)[Math.floor(Math.random() * (addresses.length - 1))];

    const {privateKey} = addresses.find(a => a.address === address);
    const txData = await getTransactionData({
      tokenId,
      to,
      privateKey
    });

    try {
      await plasma({action: "sendTransaction", payload: txData});
    } catch (e) {
      console.log(e)
    }

    // log(`Successful send Transaction tokenId: "${tokenId}"  to: "${address}"`, colors.red);


  });
  await Promise.all(promises);

  log(`End send ${promises.length} Transactions`, colors.red);
}

async function start() {
  log("Start Demo", colors.red);
  try {
    // await checkETHBalances();
    // await createAccount(10);
    // await checkETHBalances();
    // await sendEth();
    // await checkETHBalances();
    // await checkTokenBalances(true);
    // await checkTokenBalances();

    // await sendEthNodes();
    // await checkETHBalances();
    // await depositNodes(1);
    // await addCandidate();

    // await checkETHBalances();

    await deposit(100000, false);
    // await checkTokenBalances();

    // await sendTransactions();
    // await checkTokenBalances();

  } catch (e) {
    console.log(e);
  }
  log("End Demo", colors.red);
  process.exit(0);
}


start();


function log(message, color = 37) {
  const time = new Date();
  time.toTimeString()
  console.log(`${time.toISOString()}:  \x1b[${color}m${message}\x1b[0m`);
}
