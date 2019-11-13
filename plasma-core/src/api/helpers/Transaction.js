/**
 * Created by Oleksandr <alex@moonion.com> on 13.11.2019
 * moonion.com;
 */

import * as ethUtil from 'ethereumjs-util';


const TYPES = {
  PAY: 1,
  VOTE: 2,
  UN_VOTE: 3,
  CANDIDATE: 4,
  RESIGNATION: 5,
  PRIVATE: 6
};
const TYPES_LABELS = {
  1: 'pay',
  2: 'vote',
  3: 'unVote',
  4: 'candidate',
  5: 'resignation',
  6: 'private'
};

function getJson(tx) {
  if (tx._json)
    return tx._json;
  tx._json = {
    prevHash: ethUtil.addHexPrefix(tx.prevHash.toString('hex')),
    prevBlock: tx.prevBlock,
    tokenId: tx.tokenId,
    type: TYPES_LABELS[tx.type],
    fee: tx.fee.toString(),
    totalFee: tx.totalFee.toString(),
    newOwner: ethUtil.addHexPrefix(tx.newOwner.toString('hex')),
    data: tx.data.toString(),
    signature: ethUtil.addHexPrefix(tx.signature.toString('hex')),
    hash: ethUtil.addHexPrefix(tx.hash.toString('hex')),
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  };

  return tx._json;
}

export {
  getJson
}
