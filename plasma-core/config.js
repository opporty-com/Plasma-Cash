const homedir = require('os').homedir()

export default {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0x6134cf6bd676ff7abd287a02b54774de9fd2b79a',
  plasmaOperatorAddress: process.env.PLASMA_OPERATOR_ADDRESS ?
    process.env.PLASMA_OPERATOR_ADDRESS :
    '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  plasmaOperatorPassword: process.env.PLASMA_OPERATOR_PASSWORD ?
    process.env.PLASMA_OPERATOR_PASSWORD :
    '9',
  plasmaOperatorKey: process.env.PLASMA_OPERATOR_PRIVATE ?
    process.env.PLASMA_OPERATOR_PRIVATE :
    '',
  maxDelegates: 30,
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://127.0.0.1:8545',
  blockPeriod: 60000,
  blockTime: 10000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development',
  logDir: homedir + '/Plasma-Cash/logs',
}
