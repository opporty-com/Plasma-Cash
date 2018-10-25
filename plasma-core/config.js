const homedir = require('os').homedir()

export default {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0x6134cf6bd676ff7abd287a02b54774de9fd2b79a',
  plasmaNodeAddress: process.env.PLASMA_NODE_ADDRESS ?
    process.env.PLASMA_NODE_ADDRESS :
    '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  plasmaNodePassword: process.env.PLASMA_NODE_PASSWORD ?
    process.env.PLASMA_NODE_PASSWORD :
    '9',
  plasmaNodeKey: process.env.PLASMA_NODE_PRIVATE ?
    process.env.PLASMA_NODE_PRIVATE :
    '',
  maxDelegates: 30,
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://127.0.0.1:8545',
  blockPeriod: 5000,
  blockTime: 10000,
  roundInterval: 300000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development',
  logDir: homedir + '/Plasma-Cash/logs',
}
