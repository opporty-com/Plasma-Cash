import web3 from "../root-chain/web3";
import * as RLP from 'rlp'
import contractHandler from "../root-chain/contracts/plasma";
import keythereum from "keythereum";
import {promise as plasma, client as plasmaClient, send as plasmaSend, sendRLPTransaction} from "./plasma-client";
import ethUtil from "ethereumjs-util";

import BD from 'binary-data';

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
const sumEth = 10;
const datadir = "/root/.ethereum/devnet";
const defaultPassword = "123456";
const nodes = [
  {
    address: "0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70",
    password: "123123123"
  },
  {
    address: "0x11a618de3ade9b85cd811bf45af03bad481842ed",
    password: "123123123"
  },
  {
    address: "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe",
    password: "123123123"
  },
  {
    address: "0x4dc884abb17d11de6102fc1ef2cee0ebd31df248",
    password: "123123123"
  },
  {
    address: "0x9345a4d4a43815c613cf9e9db1920b9c9eeb8dc7",
    password: "123123123"
  },

];


// let addresses = [
//   {
//     address: "0x95006D7ddb8dc5BE140d06ECe1Bdb1FffBe81385",
//     password: defaultPassword,
//   }, {
//     address: "0xe30C44EAAe07B21768B9023cD86a939a528126Db",
//     password: defaultPassword,
//   }, {
//     address: "0xAA833586FD627d4A9fA4814A165e5b87CEA05e93",
//     password: defaultPassword,
//   }, {
//     address: "0xa7A2c3a83B9807873caa6C7C0622cBF82667e097",
//     password: defaultPassword,
//   }, {
//     address: "0x2d7db92Fcc8203cD247cD36fAdbA3F86Fb38b1f4",
//     password: defaultPassword,
//   }, {
//     address: "0xC20C7E7d92580d367D0827FF03CBD01636B9aA4e",
//     password: defaultPassword,
//   }, {
//     address: "0xd80448a597DFD36Cc3612d2Eb3567EAedCF899c1",
//     password: defaultPassword,
//   }
// ];

let addresses = [];


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

function setPrivateKeys() {
  addresses = addresses.map(a => {
    const keyObject = keythereum.importFromFile(a.address, datadir);
    const privateKey = keythereum.recover(defaultPassword, keyObject);

    return {...a, privateKey: privateKey.toString('hex')}
  })
}

async function createAccount(count = 6) {
  log("Start create test account", colors.crimson);
  const {address: from, password} = nodes[0];
  await web3.eth.personal.unlockAccount(from, password);

  for (let i = 0; i < count; i++) {
    const address = await web3.eth.personal.newAccount(defaultPassword);
    addresses.push({
      address,
      password: defaultPassword,
    });
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


const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
  hash: BD.types.string(64),
};


const TransactionHashProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.uint24le,
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  data: BD.types.buffer(null),
};

async function deposit(countPerAddress = 1, useEth = true) {
  log("Start deposit from test address", colors.blue);


  let allPromises = [];
  for (let account of addresses) {
    const {address, password} = account;
    let promises = [];
    // const tokenId = generateRandomString();
    // let payload = {
    //   depositor: address, tokenId, send: true
    // };

    for (let i = 0; i < countPerAddress; i++) {
      let promise = new Promise(async (resolve, reject) => {
        if (!useEth) {

          // const data = [
          //   ethUtil.toBuffer('0x123'),
          //   ethUtil.toBuffer(-1),
          //   ethUtil.toBuffer(ethUtil.stripHexPrefix(tokenId)),
          //   ethUtil.toBuffer(address),
          //   ethUtil.toBuffer('pay'),
          //   ethUtil.toBuffer('')
          // ];
          const data = {
            prevHash: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),
            prevBlock: 0,
            tokenId: i,
            type: 1,
            newOwner: Buffer.from(ethUtil.stripHexPrefix(address), 'hex'),
            data: Buffer.from('')
          };


          const dataHash = BD.encode(data, TransactionHashProtocol)
          data.hash = ethUtil.keccak(dataHash.slice()).toString('hex');
          const packet = BD.encode(data, TransactionProtocol);
          const res = await plasma(packet.slice());
          console.log(res);
          // await plasma(data);


          // await plasma({action: "deposit", payload: {depositor: address, tokenId, send: true}});
          // await plasma({action: "deposit", payload});
          tokens[tokenId] = {tokenId, address};
          return resolve({tokenId, address});
        }
        const gas = await contractHandler.contract.methods.deposit().estimateGas({from: address});
        await web3.eth.personal.unlockAccount(address, password, 100000);
        let answer = await contractHandler.contract.methods.deposit()
          .send({from: address, value: 1, gas: gas + 1500000});
        const tokenId = answer.events.DepositAdded.returnValues.tokenId;

        tokens[tokenId] = {tokenId, address};
        return resolve({tokenId, address});
      });
      promises.push(promise)
    }
    await Promise.all(promises);
    log(`Deposit ${promises.length} tokens`, colors.blue);
  }
  //
  // for (let promises of allPromises) {
  //   await Promise.all(promises);
  //   log(`Deposit ${promises.length} tokens`, colors.blue);
  // }


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
    await checkETHBalances();
    await createAccount(1);
    // setPrivateKeys();
    // await checkETHBalances();
    // await sendEth();
    // await checkETHBalances();
    // await checkTokenBalances(true);
    // await checkTokenBalances();
    await deposit(1, false);
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
