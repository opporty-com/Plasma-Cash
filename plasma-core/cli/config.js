module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xdb482bb377487c67de33543ce64f308f21c20ade',
  address: '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  password: '123123123',
  privateKey: '2a878f25bbb926a83d80c23c30b2eafe2038823e615b2e0095c8c4c51fb401c7',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://localhost:8545'
}
