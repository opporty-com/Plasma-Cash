const homedir = require('os').homedir()
const {randomBytes} = require('crypto')

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
  bootNode: process.env.BOOTNODE || false,
  dptKey: process.env.DPT_KEY ? Buffer.from(process.env.DPT_KEY, 'hex') : randomBytes(32),
  dptPort: process.env.DPT_PORT || 30301,
  bootNodes: process.env.BOOT_NODES || [
    {address: '192.168.254.112',
      udpPort: 30301,
      tcpPort: 30301,
    }],
  dptEndpoint: process.env.DPT_ENDPOINT || {
    address: '0.0.0.0',
    udpPort: null,
    tcpPort: null,
  },
  maxDelegates: 5,
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: null,
  blockPeriod: 5000,
  blockTime: 10000,
  roundInterval: 300000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development',
  logDir: homedir + '/Plasma-Cash/logs',
}
