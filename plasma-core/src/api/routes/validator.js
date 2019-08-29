/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */


import {getCandidates, getValidators, getCurrent} from '../controllers/Validator'
import {getCandidatesResponse, getValidatorsResponse, getCurrentValidatorResponse} from '../validates/validator'


export default [
  {
    method: 'GET',
    path: '/validator',
    handler: getValidators,
    options: {
      description: 'Get validators',
      notes: 'Returns validators',
      tags: ['api', 'validator'],
      response: {
        schema: getValidatorsResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/validator/candidates',
    handler: getCandidates,
    options: {
      description: 'Get candidates',
      notes: 'Returns  candidates',
      tags: ['api', 'validator'],
      response: {
        schema: getCandidatesResponse,
      }
    },
  },
  {
    method: 'GET',
    path: '/validator/current',
    handler: getCurrent,
    options: {
      description: 'Get current validator',
      notes: 'Returns current validator',
      tags: ['api', 'validator'],
      response: {
        schema: getCurrentValidatorResponse,
      }
    },
  },
];
