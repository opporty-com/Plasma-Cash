module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xd859dc3f136cb137b6bd36614c597691aa136bfa',
  address: '0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe',
  password: '123123123',
  privateKey: '099999f2bc38bfa01d01881738e82fcb00047976617c1228acfa6eb2bfc96de0',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: null,
  socketPath: '/var/run/mysocket'
}
