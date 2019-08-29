/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Joi from '@hapi/joi';

import {error} from "./default";


const stake = Joi.object({
  voter: Joi.string().required(),
  candidate: Joi.string().required(),
  value: Joi.number().required(),
}).label('Stake');

const candidate = Joi.object({
  address: Joi.string().required(),
  stakes: Joi.array().required().items(stake).label('Stakes'),
  weight: Joi.number().required(),
}).label('Candidate');

const validator = Joi.string().required().label('Validator');

const getCandidatesResponse = Joi.alternatives().try([
  Joi.array().required().items(candidate).label('Candidates'),
  error
]);

const getValidatorsResponse = Joi.alternatives().try([
  Joi.array().required().label('Validators'),
  error
]);

const getCurrentValidatorResponse = Joi.alternatives().try([ validator, error ]);

export {
  getCandidatesResponse,
  getValidatorsResponse,
  getCurrentValidatorResponse
}
