/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import Boom from '@hapi/boom';
import net from 'net'

const socketPath = '/var/run/mysocket'

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

const promiseFromEvent = data => new Promise( resolve => {
  const client = net.createConnection( socketPath, ()=> {
    client.write( JSON.stringify( data ) )
  });

  client.on("data", result => {

    let res = {}
    try {
      res = JSON.parse(result)
    } catch (e) {
      res.error = e.message
    }

    resolve( res )
  });

})

export {
  failAction,
  failActionResponse,
  promiseFromEvent
}
