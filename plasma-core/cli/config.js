module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xd859dc3f136cb137b6bd36614c597691aa136bfa',
  address: '',
  password: '',
  privateKey: '',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://localhost:8545',
  stakeHolder: '0x3d90a916af5163cac1a0e2c822d47ef224e85711',
}
