module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0x6134cf6bd676ff7abd287a02b54774de9fd2b79a',
  address: process.env.ADDRESS ?
    process.env.ADDRESS :
    '0x4c7b140ff9df71316ba91bf0bec55aa6b6e2f431',
  password: process.env.PASSWORD ?
    process.env.PASSWORD :
    'denis_address',
  privateKey: process.env.PLASMA_NODE_PRIVATE ?
    process.env.PLASMA_NODE_PRIVATE :
    '2a878f25bbb926a83d80c23c30b2eafe2038823e615b2e0095c8c4c51fb401c7',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://localhost:8545',
  stakeHolder: '0x3d90a916af5163cac1a0e2c822d47ef224e85711'
}
