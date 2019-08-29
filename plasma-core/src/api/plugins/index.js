/**
 * Created by Oleksandr <alex@moonion.com> on 2019-06-09
 * moonion.com;
 */

import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import HapiSwagger from 'hapi-swagger'
import path  from 'path';

const pkg = require('../../../package');


const swaggerOptions = {
  // swaggerUI: false,
  documentationPage: false,
  swaggerUIPath: "/documentation/",
  // templates: path.resolve(__dirname, 'swagger-ui'),
  info: {
    title: 'Plasma API Documentation',
    version: pkg.version,
  },
  tags: [
    {'name': 'block'},
  ],
  // jsonEditor: true,
};

export default [
  Inert,
  Vision,
  {
    plugin: HapiSwagger,
    options: swaggerOptions
  }
]
