'use strict';

import Ajv  from 'ajv';
import fs   from 'fs';
import path  from 'path';

const AJV_OPTIONS = {
  removeAdditional: true,
  coerceTypes: true,
  useDefaults: true,
  allErrors: true,
  errorDataPath: 'property',
  jsonPointers: true // ajv-errors required
};
const ajv = new Ajv(AJV_OPTIONS);

export function validateRequestBySchema (schemaPath, data) {
  return new Promise((resolve, reject) => {
    let schema;
    if (fs.existsSync(path.join(__dirname, schemaPath))) {
      schema = require(schemaPath);
    }  else {
      throw new Error(`schema ${schemaPath} not found`);
    }

    let valid = {errors:[]};

    let validate = ajv.compile(schema);
    if (!validate(data)) {
      valid.errors = validate.errors;
    }

    if (valid.errors.length) {
      reject({ status: 422, message: valid.errors, type:'json-schema' });
    } else {
      resolve(data);
    }
  });
};

export default function validate (schemaName = null) {
  if (!schemaName) {
    throw Error('schemaName required');
  }

  let schemaPath = `../schema/${schemaName}.json`;

  return function (req, res, next) {
    return validateRequestBySchema(schemaPath, req['body'])
      .then((formData) => {
        req.formData = formData;
        return next();
      })
      .catch(err => next(err));
  };
};
