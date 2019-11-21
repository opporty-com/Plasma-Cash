/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import validators from '../lib/Validators';
import * as Validator from '../models/Validator';
import * as Token from '../models/Token';
import * as Transaction from '../models/Transaction';
import {send as sendTx} from './Transaction';


async function getCandidates() {
  const validatorsArr = await Validator.getCandidates();
  if (!validatorsArr.length) throw new Error("Candidates not found");
  return validatorsArr.map(v => v);
}

async function getValidators() {
  const validatorsArr = await Validator.getValidators();
  if (!validatorsArr.length) throw new Error("Validators not found");
  return validatorsArr.map(v => v);
}

async function getCurrent() {
  const current = validators.getCurrent();
  if (!current) throw new Error("Current not found!");
  return current;
}


async function addToValidator({operator}) {
  await Validator.addToValidator(ethUtil.addHexPrefix(operator).toLowerCase());
  await validators.resetValidators();
  return true
}

async function deleteFromValidator({operator}) {
  await Validator.deleteFromValidator(ethUtil.addHexPrefix(operator).toLowerCase());
  await validators.resetValidators();

  const nodeAddress = ethUtil.addHexPrefix(process.env.PLASMA_NODE_ADDRESS).toLowerCase();
  const tokens = await Validator.getVoteTokens(operator, nodeAddress);
  if (!tokens.length)
    return true;

  for (const tokenId of tokens) {

    const prevTx = await Transaction.getLastByToken(tokenId);

    let tx = {
      prevHash: prevTx.hash,
      prevBlock: prevTx.blockNumber,
      tokenId,
      newOwner: ethUtil.toBuffer(operator),
      type: Transaction.TYPES.UN_VOTE,
      dataLength: 0,
      data: ethUtil.toBuffer(''),
      totalFee: prevTx.totalFee,
      fee: "0",
    };
    tx = Transaction.sign(tx);
    await sendTx(tx);
  }

}


export {
  getCandidates,
  getValidators,
  getCurrent,
  addToValidator,
  deleteFromValidator
}
