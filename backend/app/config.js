module.exports = {
  plasmaContractAddress: process.env.PLASMA_CONTRACT_ADDRESS,
  plasmaOperatorAddress: process.env.PLASMA_OPERATOR_ADDRESS,
  plasmaOperatorPassword: process.env.PLASMA_OPERATOR_PASSWORD,
  plasmaOperatorKey: process.env.PLASMA_OPERATOR_PRIVATE,
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
  web3HttpProvider: process.env.WEB3_HTTP_PROVIDER,
  blockCreationPeriod: 30000,
  startBlockNumber: 1, // first nlock number in Root contract
  contractblockStep: 1
};
