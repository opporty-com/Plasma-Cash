'use strict';

import { logger }  from './logger';

function logErrors(err, req, res, next) {
  let logInfo = {
    url: req.url,
    method: req.method,
    params: req._params || req.params,
    query: req.query,
    body: req.body,
    error: err
  };

  if (process.env.NODE_ENV == 'development' && err) {
    console.error(err.stack);
  }
  logger.error(logInfo);
  next(err);
}

function validationErrors (error, req, res, next) {
  if (error.status == 422 && error.type == 'json-schema') {
    if (Array.isArray(error.message)) {
      let errorsList = [];
      error.message.forEach(e => {
        let path = e.dataPath.slice(1);

        errorsList.push({
          path,
          message: e.keyword,
          raw_message: e.message
        });
      });

      return next({
        status: 422,
        message: {
          errors: errorsList
        },
        type: 'validation'
      });
    }
  }

  return next(error);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500);
  let error = err;
  let type  = error.type || null;
  let code  = error.code || null;
  if (error && error.status) {
    delete error.status;
  }

  if (error && error.message) {
    error = error.message;
  }

  let errorData = {
    error,
    type
  };

  code && (errorData.code = code);

  res.json(errorData);
}

function handler404(req, res, next) {
  next({ status: 404, message: 'Route not found' });
}

module.exports = function(app) {
  app.use('*', handler404);
  app.use(logErrors);
  app.use(validationErrors);
  app.use(errorHandler);
};
