
import Joi from '@hapi/joi';

import {trxResponse} from "./default";

const getByNumber = Joi.object({
  number: Joi.string().required().description('Number for block you need'),
}).label('getByNumber')

const getBlockResponse = Joi.alternatives().try([
  Joi.object({
    number: Joi.number(),
    merkleRootHash: Joi.string(),
    transactions: Joi.array().items(trxResponse),
    signature: Joi.string().allow(null).allow(''),
    totalFee: Joi.string(),
  }),
  Joi.object({ error: Joi.string() })
]).label('Block')

const getByNumberAndTokenId = Joi.object({
  blockNumber: Joi.string().required().description('Number for block you need'),
  tokenId: Joi.string().required().description('Token id for block you need')
}).label('getByNumberAndTokenId')


const getProofResponse = Joi.object({
  hash: Joi.string().required().description('Proof hash'),
}).label('getProofResponse')


const checkProofRequest = Joi.object({
  blockNumber: Joi.string().required().description('Number for block you need'),
  hash: Joi.string().required().description('Transaction hash for block you need'),
  proof: Joi.string().required().description('Proof for block you need'),
}).label('checkProofRequest')

const checkProofResponse = Joi.object({
  result: Joi.boolean().required().description('Results'),
}).label('checkProofResponse')

export { getByNumber, getBlockResponse, getByNumberAndTokenId, getProofResponse, checkProofRequest , checkProofResponse}
