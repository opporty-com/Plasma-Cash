/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import {get, last} from '../controllers/Block'
import { getByNumber, getBlockResponse } from '../validates/block'

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
  }
];
