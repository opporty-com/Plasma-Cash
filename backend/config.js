module.exports = {
  plasmaContractAddress: process.env.PLASMA_CONTRACT_ADDRESS ? process.env.PLASMA_CONTRACT_ADDRESS : '0x266f6e778dac60280515a466c325061db31c7b63',
  plasmaOperatorAddress: process.env.PLASMA_OPERATOR_ADDRESS ? process.env.PLASMA_OPERATOR_ADDRESS : '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  plasmaOperatorPassword: process.env.PLASMA_OPERATOR_PASSWORD ? process.env.PLASMA_OPERATOR_PASSWORD : '123123123',
  plasmaOperatorKey: process.env.PLASMA_OPERATOR_PRIVATE ? process.env.PLASMA_OPERATOR_PRIVATE : '',
  prefixes: {
    utxoPrefix: 'utxo',
    utxoWithAddressPrefix: 'autxo',
    blockPrefix: 'block',
    lastBlockSubmittedToParentPrefix: 'lastBlockSubmited',
    tokenIdPrefix: 'tokenId',
    depositNotAddedToBlockIndexPrefix: 'depositNotInBlockIndex',
    lastEventProcessedBlockPrefix: 'lastEventProcessed'
  },
  gethIpc: '/usr/src/geth_ipc/geth.ipc',
  web3HttpProvider: 'http://127.0.0.1:8545',
  blockCreationPeriod: 30000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1,
  isDevelopment: process.env.NODE_ENV == 'development',
  dbPath: '/Users/vladimirkovalcuk/Plasma-Cash/data/leveldb/data'
};
