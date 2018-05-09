'use strict';
import winston  from 'winston';
import { mkdirSyncRecursive } from 'lib/helpers/utills';

const moment = require('moment-timezone').tz.setDefault(process.env.TIME_ZONE || 'America/New_York');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

const tsFormat = () => (moment().format('DD:MM:YYYY HH:mm:ss.SSS'));

const LoggerInstance = (name = null, logDir = '/usr/src/app/app/logs') => {
  const logDirError = `${logDir}/${name ? name + '/' : ''}error`;
  const logDirInfo = `${logDir}/${name ? name + '/' : ''}info`;

  mkdirSyncRecursive(logDir);
  mkdirSyncRecursive(logDirError);
  mkdirSyncRecursive(logDirInfo);

  const winstonInstance =  new winston.Logger({
    level:'debug',
    emitErrs: true,
    transports: [
      new (winston.transports.Console)({
        name: 'console',
        handleExceptions: false,
        prettyPrint: true,
        silent:false,
        timestamp: tsFormat,
        depth: 5,
        colorize: true,
        json: false
      }),
      new (winston.transports.DailyRotateFile)({
        name: 'error',
        filename: `${logDirError}/-error.log`,
        timestamp: tsFormat,
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        level: 'error'
      }),
      new (winston.transports.DailyRotateFile)({
        level:'info',
        name: 'info',
        filename: `${logDirInfo}/-info.log`,
        handleExceptions: false,
        prettyPrint: true,
        depth: 5,
        silent:false,
        json: true,
        colorize: true,
        timestamp: tsFormat,
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        stderrLevels: ['info']
      })
    ],

    exceptionHandlers: [
      new winston.transports.File({ filename: `${logDir}/log-exceptions.log`, timestamp: tsFormat }),
      new (winston.transports.Console)({
        colorize: true,
        handleExceptions: true,
        prettyPrint: true
      })
    ],
    exitOnError: true
  });
  winstonInstance.level = process.env.LOG_LEVEL || 'info';
  return winstonInstance;
};

const logger = LoggerInstance();

export {
  logger
};
