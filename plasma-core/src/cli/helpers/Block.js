import * as ethUtil from 'ethereumjs-util';
import * as Transaction from './Transaction';

function getJson(block) {
  if (block._json)
    return block._json;
  block._json = {
    number: block.number,
    merkleRootHash: ethUtil.addHexPrefix(block.merkleRootHash.toString('hex')),
    totalFee: block.totalFee,
    transactions: block.transactions.map(tx => Transaction.getJson(tx)),
    signature: ethUtil.addHexPrefix(block.signature.toString('hex'))
  };

  return block._json;
}

export {
  getJson
}
