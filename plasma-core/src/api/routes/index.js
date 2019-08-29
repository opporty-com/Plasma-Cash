/**
 * Created by Oleksandr <alex@moonion.com> on 2019-06-09
 * moonion.com;
 */

import path from 'path';

import token from './token';
//import helper from './helper';
import block from './block';
import validator from './validator';
import transaction from './transaction';


export default [
   ...token, ...block, ...transaction, ...validator,
  //...transaction,
  //...helper,

  {
    method: 'GET',
    path: '/documentation',
    config: {
      handler: function (request, h) {
        return h.view('index.html', {});
      }
    }
  },
  {
    method: 'GET',
    path: '/documentation/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, '../plugins/swagger-ui')
      }
    }
  }
]
