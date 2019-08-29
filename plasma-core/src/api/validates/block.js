
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
    signer: Joi.string(),
    signature: Joi.string().allow(null).allow('')
  }),
  Joi.object({ error: Joi.string() })
]).label('Block')


export { getByNumber, getBlockResponse }
