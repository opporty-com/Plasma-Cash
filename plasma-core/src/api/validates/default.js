/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Joi from '@hapi/joi'



const transactionType = [
  'pay',
  'vote',
  'unvote',
  'candidate',
  'resignation'
];

const error = Joi.object({
  message: Joi.string(),
  status: Joi.string(),
  statusCode: Joi.number(),
  details: Joi.array(),
  error: Joi.string()
}).label('Error');


const trxResponse = Joi.object({
  prevHash:  Joi.string(),
  prevBlock:  Joi.number(),
  tokenId: Joi.string(),
  data: Joi.string().allow(null).allow(''),
  type: Joi.string().allow(transactionType),
  fee: Joi.string(),
  totalFee: Joi.string(),
  newOwner: Joi.string(),
  signature: Joi.string(),
  blockNumber: Joi.number(),
  timestamp: Joi.number(),
  hash: Joi.string()
}).label("Transaction")


export { error, trxResponse }
