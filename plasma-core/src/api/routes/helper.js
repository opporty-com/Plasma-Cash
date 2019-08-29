/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import {generateKeyPair} from '../controllers/helper'
import {generateKeyPairResponse} from '../validates/helper'

export default [
  {
    method: 'POST',
    path: '/helper/keyPair',
    handler: generateKeyPair,
    options: {
      description: 'Get BLS private and public keys',
      notes: 'Returns BLS private and public keys',
      tags: ['api', 'helper'],
      response: {
        schema: generateKeyPairResponse,
      }
    },
  }
];
