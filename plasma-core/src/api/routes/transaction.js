/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import {send, getPool, get, getTransactionsByAddress} from '../controllers/Transaction'
import {getByHash, sendPayload, getByHashResponse, getPoolResponse, sendResponse} from '../validates/transaction'
import {getAllTrxResponse, getByAddress as byAddress} from "../validates/token";

export default [
  {
    method: 'GET',
    path: '/transaction/getPool',
    handler: getPool,
    options: {
      description: 'Get pool transactions',
      notes: 'Returns transaction into pool',
      tags: ['api', 'transaction'],
      response: {
        schema: getPoolResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/transaction/{hash}',
    handler: get,
    options: {
      description: 'Get transaction by hash',
      notes: 'Returns transaction into pool',
      tags: ['api', 'transaction'],
      validate: {
        params: getByHash
      },
      response: {
        schema: getByHashResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/transaction/address/{address}',
    handler: getTransactionsByAddress,
    options: {
      description: 'Get all transactions by address',
      notes: 'Returns token by address',
      tags: ['api', 'token'],
      validate: {
        params: byAddress
      },
      response: {
        schema: getAllTrxResponse,
      }
    },
  },
  {
    method: 'POST',
    path: '/transaction',
    handler: send,
    options: {
      description: 'Send signed transaction',
      notes: 'Returns success result',
      tags: ['api', 'transaction'],
      validate: {
        payload: sendPayload
      },
      response: {
        schema: sendResponse,
      }
    },
  }
];
