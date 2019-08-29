
import Joi from '@hapi/joi';

import {error, trxResponse} from "./default";



const getByTokenId = Joi.object({
  tokenId: Joi.string().required().description('Token Id for token you need'),
})

const getByAddress = Joi.object({
  address: Joi.string().required().description('Address for token you need'),
})

const tokenJoi = Joi.object({
  owner: Joi.string(),
  tokenId: Joi.string(),
  amount: Joi.number(),
  block: Joi.number()
}).label('Token')

const getTrxResponse =  Joi.alternatives().try([
  trxResponse,
  Joi.object({ error: Joi.string() })
]).label('Transaction')

const getAllTrxResponse = Joi.array().items(trxResponse).label("AllTransaction")

const getTokenByIdResponse = Joi.alternatives().try([
  tokenJoi,
  Joi.object({ error: Joi.string() })
]).label('TokenById')

const getTokensByAddressResponse = Joi.alternatives().try([
  Joi.array().items(tokenJoi),
  Joi.object({ error: Joi.string() })
]).label('TokenByAddress')


export { getByTokenId, getByAddress, getTrxResponse, getAllTrxResponse, getTokenByIdResponse, getTokensByAddressResponse  }
