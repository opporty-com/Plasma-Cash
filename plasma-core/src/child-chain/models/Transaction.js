/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */

import * as RLP from 'rlp'
import * as ethUtil from 'ethereumjs-util';
import BN from 'bn.js'
import BD from 'binary-data';

import plasmaContract from "../../root-chain/contracts/plasma";

import config from "../../config";

import * as TxMemPoolDb from './db/TxMemPool';
import * as TransactionDb from './db/Transaction';
import * as Token from './Token';
import * as Validator from './Validator';


export const TYPES = {
  PAY: 1,
  VOTE: 2,
  UN_VOTE: 3,
  CANDIDATE: 4,
  RESIGNATION: 5,
  PRIVATE: 6
};


const Protocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.string(null),
  totalFee: BD.types.string(null),
  fee: BD.types.string(null),
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  dataLength: BD.types.uint24le,
  data: BD.types.buffer(({current}) => current.dataLength),
  signature: BD.types.buffer(65),
  hash: BD.types.buffer(32),
  blockNumber: BD.types.uint24le,
  timestamp: BD.types.uint48le,
};

function getBuffer(tx) {
  if (tx._buffer)
    return tx._buffer;

  const packet = BD.encode(tx, Protocol);
  tx._buffer = packet.slice();
  return tx._buffer;
}

function getHash(tx) {
  if (tx.hash)
    return tx.hash;

  if (!tx._hashBuffer) {
    const dataToEncode = [
      tx.prevHash,
      tx.prevBlock,
      new BN(tx.tokenId),
      tx.newOwner,
      tx.type,
      new BN(tx.totalFee),
      new BN(tx.fee),
      tx.data,
      tx.signature,
    ];
    tx._hashBuffer = RLP.encode(dataToEncode);
  }
  tx.hash = ethUtil.keccak(tx._hashBuffer);
  return tx.hash
}


function getSignHash(tx) {
  if (tx._signHash)
    return tx._signHash;
  if (!tx._signBuffer) {
    const dataToEncode = [
      tx.prevHash,
      tx.prevBlock,
      new BN(tx.tokenId),
      tx.newOwner,
      tx.type,
      new BN(tx.totalFee),
      new BN(tx.fee),
      tx.data,
    ];
    tx._signBuffer = RLP.encode(dataToEncode);
  }
  tx._signHash = ethUtil.keccak(tx._signBuffer);
  return tx._signHash
}

function sign(tx) {

  if (tx.signature)
    return tx;

  const _signHash = getSignHash(tx);

  let msgHash = ethUtil.hashPersonalMessage(_signHash);
  let key = Buffer.from(config.plasmaNodeKey, 'hex');
  let sig = ethUtil.ecsign(msgHash, key);
  tx.signature = ethUtil.toBuffer(ethUtil.toRpcSig(sig.v, sig.r, sig.s))

  return tx;
}

function getSigner(tx) {
  if (tx._signer)
    return tx._signer;

  const hash = getSignHash(tx);
  try {
    let sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(tx.signature));
    let msgHash = ethUtil.hashPersonalMessage(hash);
    let pubKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    tx._signer = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
  } catch (error) {
    throw new Error("Invalid signature")
  }
  return tx._signer;

}


async function validateToken(token, owner) {

  if (token.status !== Token.STATUSES.ACTIVE)
    return false;

  return token.owner === owner;
}


async function validate(tx, returnFee = false) {
  const fee = new BN(tx.fee);
  return returnFee ? fee : true;

  const prevTx = await get(tx.prevHash);

  if (prevTx) {
    const calcFee = new BN(tx.totalFee).sub(prevTx.totalFee);
    if (calcFee.eq(fee))
      return false;

    if (tx.tokenId !== prevTx.tokenId)
      return false;

    if (tx.prevBlock !== prevTx.blockNumber)
      return false;

  }
  const token = await Token.get(tx.tokenId);
  const isValidToken = await validateToken(token, getSigner(tx));


  switch (tx.type) {
    case TYPES.PAY:
      if (token && (tx.prevBlock === 0 || !isValidToken))
        return false;

      return returnFee ? fee : true;

    case TYPES.VOTE:
    case TYPES.CANDIDATE:
      if (!prevTx)
        return false;

      if (!isValidToken)
        return false;

      return returnFee ? fee : true;

    case TYPES.UN_VOTE:
      if (!prevTx)
        return false;

      if (!isValidToken)
        return false;


      if (prevTx.tokenId !== tx.tokenId)
        return false;
      if (prevTx.type !== TYPES.VOTE)
        return false;
      if (prevTx.newOwner.toString('hex') !== tx.newOwner.toString('hex'))
        return false;
      if (getSigner(tx) !== getSigner(prevTx))
        return false;

      return returnFee ? fee : true;

    case TYPES.RESIGNATION:
      if (!prevTx)
        return false;

      if (!isValidToken)
        return false;

      if (prevTx.tokenId !== tx.tokenId)
        return false;

      if (prevTx.type !== TYPES.CANDIDATE)
        return false;

      if (getSigner(tx) !== getSigner(prevTx))
        return false;

      return returnFee ? fee : true;

    default:
      return false;
  }
}

async function execute(tx) {
  if (tx.type === TYPES.PAY) {
    await save(tx);
    return true;
  }

  if (tx.type === TYPES.VOTE) {
    await Validator.voteCandidate(getSigner(tx), tx.newOwner, tx.tokenId);
    await save(tx);
    return true;
  }

  if (tx.type === TYPES.UN_VOTE) {
    await Validator.unVoteCandidate(getSigner(tx), tx.newOwner, tx.tokenId);
    await save(tx);
    return true;
  }


  if (tx.type === TYPES.CANDIDATE) {
    await Validator.addToCandidate(getSigner(tx), tx.tokenId);
    await save(tx);
    return true;
  }

  if (tx.type === TYPES.RESIGNATION) {
    await Validator.deleteFromCandidate(getSigner(tx), tx.tokenId);
    await save(tx);
    return true;
  }

}

async function pushToPool(tx) {
  return await TxMemPoolDb.addTransaction(getHash(tx), getBuffer(tx))
}

async function removeFromPool(tx) {
  return await TxMemPoolDb.remove(getHash(tx));
}

async function getPool(limit) {
  const data = await TxMemPoolDb.getTransactions(limit);
  if (data.length === 0) {
    return []
  }
  return data.map(tx => BD.decode(tx, Protocol))
}

async function getPoolSize() {
  return await TxMemPoolDb.size();
}




async function save(tx) {
  const oldToken = await Token.get(tx.tokenId);
  let token = {
    id: tx.tokenId,
    owner: tx.newOwner,
    block: tx.blockNumber,
    amount: oldToken ? oldToken.amount : await plasmaContract.getTokenBalance(tx.tokenId),
    totalFee: tx.totalFee,
    status: Token.STATUSES.ACTIVE

  };

  let promises = [
    Token.save(token),
    TransactionDb.add(getHash(tx), getBuffer(tx)),
    TransactionDb.addToAddress(tx.newOwner, getHash(tx)),
    TransactionDb.addToToken(tx.tokenId, getHash(tx)),
  ];

  if (oldToken)
    promises.push(TransactionDb.addToAddress(oldToken.owner, getHash(tx)));

  await Promise.all(promises);
  return tx;
}


async function get(hash) {
  const tx = await TransactionDb.get(ethUtil.stripHexPrefix(hash));
  if (!tx)
    return null;
  return BD.decode(tx, Protocol);
}

async function getByToken(tokenId) {
  const transactions = await TransactionDb.getByToken(tokenId);
  if (!transactions) return [];
  return Promise.all(transactions.map(hash => get(hash)));
}

async function getLastByToken(tokenId) {
  const hash = await TransactionDb.getLastByToken(tokenId);
  if (!hash) return null;
  return await get(hash)
}

async function getByAddress(address) {
  const transactions = await TransactionDb.getByAddress(ethUtil.stripHexPrefix(address));
  if (!transactions) return [];
  return Promise.all(transactions.map(hash => get(hash)));
}

function getJson(tx) {
  if (tx._json)
    return tx._json;
  tx._json = {
    prevHash: ethUtil.addHexPrefix(tx.prevHash.toString('hex')),
    prevBlock: tx.prevBlock,
    tokenId: tx.tokenId,
    type: tx.type,
    newOwner: ethUtil.addHexPrefix(tx.newOwner.toString('hex')),
    data: tx.data.toString(),
    signature: ethUtil.addHexPrefix(tx.signature.toString('hex')),
    hash: ethUtil.addHexPrefix(tx.hash.toString('hex')),
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  };

  return tx._json;
}

async function count() {
  return await TransactionDb.count();
}

export {
  Protocol,
  sign,
  validate,
  pushToPool,
  removeFromPool,
  getPoolSize,
  getPool,
  execute,
  getJson,
  getBuffer,
  getByToken,
  getLastByToken,
  getByAddress,
  get,
  count
}
