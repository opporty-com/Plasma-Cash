/**
 * Created by Oleksandr <alex@moonion.com> on 2019-06-09
 * moonion.com;
 */

import Hapi from '@hapi/hapi';
import handlebars from 'handlebars';
import path  from 'path';

import routes from './routes';
import plugins from './plugins';


import {failAction, failActionResponse} from './helpers';


const init = async () => {

  const server = Hapi.server({
    port: 80,
    host: '0.0.0.0',
    routes: {
      validate: {failAction},
      response: {failAction: failActionResponse}
    }
  });

  await server.register(plugins);

  server.route(routes);
  server.views({
    path: path.resolve(__dirname, 'plugins/swagger-ui'),
    engines: { html: handlebars },
    isCached: false
  });


  try {
    await server.start();
    console.log('Server running at:', server.info.uri);
  } catch (err) {
    console.log(err);
  }


};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
