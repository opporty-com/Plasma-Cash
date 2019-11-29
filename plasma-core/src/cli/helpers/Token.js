import * as ethUtil from 'ethereumjs-util';

const STATUSES_LABELS = {
  1: 'active',
  2: 'inExit',
  3: 'exit',
  4: 'guarantee'
};

function getJson(token) {
  if (token._json)
    return token._json;
  token._json = {
    id: token.id,
    owner: ethUtil.addHexPrefix(token.owner.toString('hex')),
    block: token.block,
    amount: token.amount.toString(),
    totalFee: token.totalFee.toString(),
    status: STATUSES_LABELS[token.status],
  };

  return token._json;
}

export {
  getJson
}
