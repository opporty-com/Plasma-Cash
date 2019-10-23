/**
 * Created by Oleksandr <alex@moonion.com> on 17.10.2019
 * moonion.com;
 */


import erc20Contract from "./erc20";
import web3 from "../root-chain/web3";
import plasmaContract from "../root-chain/contracts/plasma";


async function approveERC20(address, password, value) {
  console.log('unlockAccount');
  await web3.eth.personal.unlockAccount(address, password);

  console.log('estimate gas');
  const gasApprove = await erc20Contract.estimateApproveGas(plasmaContract.address, value, address);
  console.log('estimate approve gas', gasApprove);

  const approveAnswer = await erc20Contract.approve(plasmaContract.address, value, address, gasApprove);

  const _value = approveAnswer.events.Approval.returnValues.tokens;
  // const _value =  approveAnswer.events.Approval.returnValues.value;


  console.log('approve', gasApprove, _value);

  const allow = await erc20Contract.allowance(plasmaContract.address, address);

  console.log('allow', allow);


  const gas = await plasmaContract.estimateDepositERC20(erc20Contract.address, value, address);
  console.log('depositERC20', 0, gas);
  const answer = await plasmaContract.depositERC20(erc20Contract.address, value, address, gas);
  console.log('depositERC20', 1);
  const tokenId = answer.events.DepositAdded.returnValues.tokenId;
  console.log(tokenId);
}


async function exitERC20(address, password, tokenId) {
  console.log('unlockAccount');
  await web3.eth.personal.unlockAccount(address, password);

  console.log('estimate gas', tokenId);

  const gas = await plasmaContract.estimateExitERC20(tokenId, address);
  console.log('exitERC20', 0, gas);
  await plasmaContract.exitERC20(tokenId, address, gas);
  console.log('exitERC20', 1);

}

async function start() {
  // await approveERC20('0x1CAd72F28B34141dB68D37f43b18d5e120c51f2A', '123123123', 1);
  await exitERC20('0x1CAd72F28B34141dB68D37f43b18d5e120c51f2A', '123123123', '33621685185132020925768867051236709354847073698671221230820578631689492390767');
  console.log('end');
  process.exit(0);
}

start();
