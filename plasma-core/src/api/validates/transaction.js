/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Joi from '@hapi/joi';

import {error, trxResponse} from "./default";

const transactionType = [
  'pay',
  'vote',
  'unvote',
  'candidate',
  'resignation'
];


const sendPayload = Joi.object({
  prevHash: Joi.string().required(),
  prevBlock: Joi.number().required(),
  tokenId: Joi.string().required(),
  data: Joi.string(),
  type: Joi.string().allow(transactionType).required(),
  newOwner: Joi.string().required(),
  signature: Joi.string().required(),
}).label('sendPayload');



const sendResponse = Joi.alternatives().try([
  trxResponse,
  error
]);

const getPoolResponse = Joi.alternatives().try([
  Joi.array().items(trxResponse).label('Transactions'),
  error
]);

const getByHash = Joi.object({
  hash: Joi.string().required().description('Hash for transaction you need'),
})


const getByHashResponse =  Joi.alternatives().try([
  trxResponse,
  Joi.object({ error: Joi.string() })
]).label('Transaction')


export {
  getByHash,
  sendPayload,
  sendResponse,
  getPoolResponse,
  getByHashResponse
}
