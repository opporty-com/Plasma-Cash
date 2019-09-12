module.exports = {
  plasmaContractAddress:
    process.env.PLASMA_CONTRACT_ADDRESS ?
      process.env.PLASMA_CONTRACT_ADDRESS :
      '0xd859dc3f136cb137b6bd36614c597691aa136bfa',
  address: '0xc124b6565191071e4a5108ee1248f25cfcbe4b24',
  password: '123456',
  privateKey: '099999f2bc38bfa01d01881738e82fcb00047976617c1228acfa6eb2bfc96de0',
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: null,
  apiUrl: "http://95.216.10.211:55555"
}
