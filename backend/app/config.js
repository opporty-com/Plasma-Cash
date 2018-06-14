module.exports = {
  plasmaContractAddress: process.env.PLASMA_CONTRACT_ADDRESS ? process.env.PLASMA_CONTRACT_ADDRESS : '0x6a29207b76FD354eBd3AE4b45903a7c247f03D0a',
  plasmaOperatorAddress: process.env.PLASMA_OPERATOR_ADDRESS ? process.env.PLASMA_OPERATOR_ADDRESS : '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  plasmaOperatorPassword: process.env.PLASMA_OPERATOR_PASSWORD ? process.env.PLASMA_OPERATOR_PASSWORD : '123123123',
  plasmaOperatorKey: process.env.PLASMA_OPERATOR_PRIVATE ? process.env.PLASMA_OPERATOR_PRIVATE : '',
  prefixes: { 
    utxoPrefix: Buffer.from('utxo'),
    utxoWithAddressPrefix: Buffer.from('autxo'),
    blockPrefix: Buffer.from('block'),
    lastBlockSubmittedToParentPrefix: Buffer.from('lastBlockSubmited'),
    // depositIndexPrefix: Buffer.from('depositIndex'),
    tokenIdPrefix: Buffer.from('tokenId'),
    depositNotAddedToBlockIndexPrefix: Buffer.from('depositNotInBlockIndex'),
    lastEventProcessedBlockPrefix: Buffer.from('lastEventProcessed')
  },
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://192.168.254.152:8545',
  blockCreationPeriod: 30000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development'
};
