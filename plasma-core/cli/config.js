module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xd859dc3f136cb137b6bd36614c597691aa136bfa',
  address: '0x3f437e74d362fb9f35e36370d33290f2c7c564fa',
  password: 'hkshHKSH1',
  privateKey: '3cf33c4f3390926ded2bce4501b917b63e755b51073b100fd4fb7f6776431781',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://localhost:8545',
}
