'use strict';

const express         = require('express');
const bodyParser      = require('body-parser');
const RouterModule    = require('./app/router');
import { logger } from './app/lib/logger';
const SERVER_PORT = process.env.PORT || 80;
const REQUEST_BODY_LIMIT_SIZE = process.env.REQUEST_BODY_LIMIT_SIZE || 11534336;
import BlockCreator from 'lib/blockCreator';

let app = express();

app.disable('x-powered-by');

app.use(bodyParser.json({limit: REQUEST_BODY_LIMIT_SIZE}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(RouterModule.router);

require('./app/lib/errorHandler')(app);

BlockCreator.start();

app.listen(SERVER_PORT, function () {
  logger.info('Process ' + process.pid + ' is listening on ' + SERVER_PORT);
});
