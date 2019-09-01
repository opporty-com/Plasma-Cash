/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Boom from '@hapi/boom';


async function failAction(request, h, err) {
  console.error('ValidationError:', err);

  const error = Boom.badRequest(`Invalid request payload input`);
  error.reformat();
  error.output.payload.details = err.details;
  throw error;
}

async function failActionResponse(request, h, err) {
  if (process.env.NODE_ENV === 'production') {
    // In prod, log a limited error message and throw the default Bad Request error.
    console.error('ValidationError:', err.message);
    throw Boom.badGateway(`Invalid response data`);
  }
  // During development, log and respond with the full error.
  console.error('ResponseError:', err);
  const error = Boom.badGateway(`Invalid response data`);
  error.reformat();

  error.output.payload.details = err.details;
  throw error;

}

export {
  failAction,
  failActionResponse,
}
