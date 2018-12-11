module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xe40d2fee1554cd536c630bf5af30fdfe97f924de',
  address: '0x4c7b140ff9df71316ba91bf0bec55aa6b6e2f431',
  password: 'denis_address',
  privateKey: '2a878f25bbb926a83d80c23c30b2eafe2038823e615b2e0095c8c4c51fb401c7',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://localhost:8545',
}
