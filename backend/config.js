module.exports = {
  plasmaContractAddress: process.env.PLASMA_CONTRACT_ADDRESS ? process.env.PLASMA_CONTRACT_ADDRESS : '0x62bb53bd56613691103a9ae4af8c63495606e7ae',
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
  web3HttpProvider: 'http://127.0.0.1:8545',
  blockCreationPeriod: 30000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development',
  dbPath: '/Users/vladimirkovalcuk/Plasma-Cash/data/leveldb/data'
};
