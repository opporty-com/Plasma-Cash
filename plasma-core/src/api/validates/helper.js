/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Joi from '@hapi/joi';

import {error} from "./default";

const keyPair = Joi.object({
  private: Joi.string().required(),
  public: Joi.string().required(),
}).label('KeyPair');

const generateKeyPairResponse = Joi.alternatives().try([
  keyPair,
  error
]);


export {
  generateKeyPairResponse
}
