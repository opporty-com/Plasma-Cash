/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import {get, last, proof, checkProof} from '../controllers/Block'
import {
  getByNumber,
  getBlockResponse,
  getByNumberAndTokenId,
  getProofResponse,
  checkProofRequest,
  checkProofResponse
} from '../validates/block'

export default [
  {
    method: 'GET',
    path: '/block/last',
    handler: last,
    options: {
      description: 'Get last block',
      notes: 'Returns a last block item',
      tags: ['api', 'block'],
      response: {
        schema: getBlockResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/block/{number}',
    handler: get,
    options: {
      description: 'Get block',
      notes: 'Returns a block item by the number passed in the path',
      tags: ['api', 'block'],
      validate: {
        params: getByNumber
      },
      response: {
        schema: getBlockResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/block/getProof',
    handler: proof,
    options: {
      description: 'Get proof',
      notes: 'Returns a proof by the number and token id',
      tags: ['api', 'block'],
      validate: {
        query: getByNumberAndTokenId
      },
      response: {
        schema: getProofResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/block/checkProof',
    handler: checkProof,
    options: {
      description: 'Check proof',
      notes: 'Returns tru if is ok',
      tags: ['api', 'block'],
      validate: {
        query: checkProofRequest
      },
      response: {
        schema: checkProofResponse,
      }
    },
  }
];
