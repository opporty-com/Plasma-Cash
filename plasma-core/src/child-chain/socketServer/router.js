import {send as sendBlock, get as getBlock, last as getLastBlock, getProof, checkProof} from "../controllers/Block"
import {
  get as getToken,
  getByAddress as getTokenByAddress,
  getLastTransaction,
  getTransactions as getTransactionsByTokenId,
} from "../controllers/Token"
import {
  send as sendTransaction,
  add as addTransaction,
  deposit,
  getPool,
  get as getTransactionsByHash,
  getTransactionsByAddress
} from "../controllers/Transaction"
import {getCandidates, getValidators, getCurrent} from "../controllers/Validator"

const ROUTER = {
  "getBlock": {
    controller: arg => getBlock(arg) // number
  },
  "sendBlock": {
    controller: arg => sendBlock(arg)  // minTransactionsInBlock
  },
  "getLastBlock": {
    controller: arg => getLastBlock(arg)
  },
  "getToken": {
    controller: arg => getToken(arg) // tokenId
  },
  "getTokenByAddress": {
    controller: arg => getTokenByAddress(arg) // address
  },
  "getLastTransactionByTokenId": {
    controller: arg => getLastTransaction(arg) // tokenId
  },
  "getTransactionsByTokenId": {
    controller: arg => getTransactionsByTokenId(arg) // tokenId
  },
  "getTransactionsByAddress": {
    controller: arg => getTransactionsByAddress(arg) // tokenId
  },
  "getTransactionsByHash": {
    controller: arg => getTransactionsByHash(arg) // hash
  },
  "sendTransaction": {
    controller: arg => sendTransaction(arg) // transaction
  },
  "addTransaction": {
    controller: arg => addTransaction(arg) // transaction
  },
  "deposit": {
    controller: arg => deposit(arg) // depositor, tokenId, amount, blockNumber
  },
  "getPool": {
    controller: arg => getPool(arg) // isJson
  },
  "getCandidates": {
    controller: arg => getCandidates(arg)
  },
  "getValidators": {
    controller: arg => getValidators(arg)
  },
  "getCurrent": {
    controller: arg => getCurrent(arg)
  },
  "getProof": {
    controller: arg => getProof(arg)
  },
  "checkProof": {
    controller: arg => checkProof(arg)
  }
}


export default ROUTER
