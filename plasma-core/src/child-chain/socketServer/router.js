import {get as getBlock, last as getLastBlock, getProof, checkProof} from "../controllers/Block"
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
import { PROTOCOLS as API_PROTOCOLS } from "../../schemas/api-protocols"
import BD from 'binary-data';
import * as ethUtil from 'ethereumjs-util';

const ROUTER = {
  "getBlock": {
    controller: async arg => {
      const { number } = arg;
      let result = await getBlock(number);
      const packet = BD.encode(result, API_PROTOCOLS.getBlock.response);
      return packet.slice();
    }
  },
  "getLastBlock": {
    controller: async () => {
      let result = await getLastBlock();
      const packet = BD.encode(result, API_PROTOCOLS.getLastBlock.response);
      return packet.slice();
    }
  },
  "getToken": {
    controller: async arg => {
      const { tokenId } = arg;
      let result = await getToken(tokenId);
      const packet = BD.encode(result, API_PROTOCOLS.getToken.response);
      return packet.slice();
    }
  },
  "getTokenByAddress": {
    controller: async arg => {
      let { address } = arg;
      address = address.toString('hex');
      let tokens = await getTokenByAddress(address);
      const packet = BD.encode({
        count: tokens.length,
        tokens
      }, API_PROTOCOLS.getTokenByAddress.response);
      return packet.slice();
    }
  },
  "getLastTransactionByTokenId": {
    controller: async arg => {
      const { tokenId } = arg;
      let result = await getLastTransaction(tokenId);
      const packet = BD.encode(result, API_PROTOCOLS.getLastTransactionByTokenId.response);
      return packet.slice();
    }
  },
  "getTransactionsByTokenId": {
    controller: async arg => {
      const { tokenId } = arg;
      let transactions = await getTransactionsByTokenId(tokenId);
      const packet = BD.encode({
        count: transactions.length,
        transactions
      }, API_PROTOCOLS.getTransactionsByTokenId.response);
      return packet.slice();
    }
  },
  "getTransactionsByAddress": {
    controller: async arg => {
      const { address } = arg;
      const transactions = await getTransactionsByAddress(address);
      const packet = BD.encode({
        count: transactions.length,
        transactions
      }, API_PROTOCOLS.getTransactionsByAddress.response);
      return packet.slice();
    }
  },
  "getTransactionByHash": {
    controller: async arg => {
      const { hash } = arg;
      let result = await getTransactionsByHash(hash);
      const packet = BD.encode(result, API_PROTOCOLS.getTransactionByHash.response);
      return packet.slice();
    }
  },
  "sendTransaction": {
    controller: async arg => {
      arg.prevHash = arg.prevHash.toString('hex');
      arg.data = arg.data.toString('hex');
      arg.newOwner = arg.newOwner.toString('hex');
      arg.signature = arg.signature.toString('hex');
      let result = await sendTransaction(arg);

      const {prevHash, data, newOwner, signature} = result;
      result.prevHash = Buffer.from(prevHash, 'hex');
      result.data = Buffer.from(data, 'hex');
      result.newOwner = Buffer.from(newOwner, 'hex');
      result.signature = Buffer.from(signature,'hex');
      const packet = BD.encode(result, API_PROTOCOLS.sendTransaction.response);
      return packet.slice();
    }
  },
  "getPool": {
    controller: async () => {
      let transactions = await getPool();
      const packet = BD.encode({
        count: transactions.length,
        transactions
      }, API_PROTOCOLS.getPool.response);
      return packet.slice();
    }
  },
  "getCandidates": {
    controller: async () => {
      let data = await getCandidates();
      let candidates = data.map(c => {
        c.stakes = c.stakes || [];
        c.countStakes = c.stakes.length || 0;
        return c;
      });
      const packet = BD.encode({
        count: candidates.length,
        candidates
      }, API_PROTOCOLS.getCandidates.response);
      return packet.slice();
    }
  },
  "getValidators": {
    controller: async () => {
      let validators = await getValidators();
      const packet = BD.encode({
        count: validators.length,
        validators
      }, API_PROTOCOLS.getValidators.response);
      return packet.slice();
    }
  },
  "getCurrent": {
    controller: async () => {
      let result = await getCurrent();
      const packet = BD.encode({address: Buffer.from(result)}, API_PROTOCOLS.getCurrent.response);
      return packet.slice();
    }
  },
  "getProof": {
    controller: async arg => {
      let result = await getProof(arg);
      const packet = BD.encode(result, API_PROTOCOLS.getProof.response);
      return packet.slice();
    }
  },
  "checkProof": {
    controller: async arg => {
      arg.hash = arg.hash.toString('hex');
      let result = await checkProof(arg) ? Buffer.from('1') : Buffer.from('0');
      const packet = BD.encode({result}, API_PROTOCOLS.checkProof.response);
      return packet.slice();
    }
  },
  // "addTransaction": {
  //   controller: arg => addTransaction(arg)
  // },
  // "deposit": {
  //   controller: arg => deposit(arg)
  // },
};


export default ROUTER
