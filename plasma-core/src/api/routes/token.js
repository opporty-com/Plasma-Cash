/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import { get, getByAddress, getTransactions, getLastTransaction, getTransactionsByAddress } from '../controllers/Token'
import { getByTokenId as byToken, getByAddress as byAddress, getTrxResponse, getAllTrxResponse, getTokenByIdResponse, getTokensByAddressResponse} from '../validates/token'

export default [
  {
    method: 'GET',
    path: '/token/{tokenId}',
    handler: get,
    options: {
      description: 'Get token by id',
      notes: 'Returns token by id',
      tags: ['api', 'token'],
      validate: {
        params: byToken
      },
      response: {
        schema: getTokenByIdResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/token/address/{address}',
    handler: getByAddress,
    options: {
      description: 'Get token by address',
      notes: 'Returns token by address',
      tags: ['api', 'token'],
      validate: {
        params: byAddress
      },
      response: {
        schema: getTokensByAddressResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/token/transaction/{tokenId}',
    handler: getTransactions,
    options: {
      description: 'Get all transactions by token id',
      notes: 'Returns token by id',
      tags: ['api', 'token'],
      validate: {
        params: byToken
      },
      response: {
        schema: getAllTrxResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/token/transaction/address/{address}',
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
    method: 'GET',
    path: '/token/lastTransaction/{tokenId}',
    handler: getLastTransaction,
    options: {
      description: 'Get last transaction by token id',
      notes: 'Returns token by id',
      tags: ['api', 'token'],
      validate: {
        params: byToken
      },
      response: {
        schema: getTrxResponse,
      }
    },
  },
];

