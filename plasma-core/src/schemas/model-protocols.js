import BD from 'binary-data';

const Transaction = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.string(null),
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  dataLength: BD.types.uint24le,
  data: BD.types.buffer(({current}) => current.dataLength),
  signature: BD.types.buffer(65),
  hash: BD.types.buffer(32),
  blockNumber: BD.types.uint24le,
  timestamp: BD.types.uint48le
};

const Block = {
  number: BD.types.uint24le,
  merkleRootHash: BD.types.buffer(32),
  signature: BD.types.buffer(65),
  countTx: BD.types.uint24le,
  transactions: BD.types.array(Transaction, ({current}) => current.countTx),
};

const Token = {
  tokenId: BD.types.string(null),
  owner: BD.types.buffer(20),
  block: BD.types.uint24le,
  amount: BD.types.string(null),
  status: BD.types.uint8,
};

export {
  Transaction,
  Block,
  Token
}
