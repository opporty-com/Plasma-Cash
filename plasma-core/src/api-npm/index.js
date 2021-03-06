import  {sendTransaction, deposit, getLastBlock } from './requests'
import { createSignTransaction } from "./helpers"

const STATIC_DATA = {
  tokenId: "74606747508472834153939422909902043216245506461041191111419810376443146092084",
  address: "0xc124b6565191071e4a5108ee1248f25cfcbe4b24",
  trxNubmer: 0
}

async function createTransaction( tokenId = STATIC_DATA.tokenId, newOwner = STATIC_DATA.newOwner, trxNubmer = STATIC_DATA.trxNubmer ) {
  const type = "pay",
        prevHash = '0x123',
        prevBlockExist = !isNaN( createTransaction.prevBlock )

  console.log(`<<<<<<<<<<<<<<<<<<<<<<< START CREATE TRX NUMBER  ${ trxNubmer } >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`)

  if ( prevBlockExist ) createTransaction.prevBlock = createTransaction.prevBlock + 1
  else {
    try {
      createTransaction.prevBlock = 1 || await getPrevBlock()
    } catch (e) {
      throw new Error('Cant get previous block number')
    }
  }

  if (!address) throw new Error('Incorrect address to')
  if (!tokenId) throw new Error('Incorrect tokenId')

  const txData = { prevHash, prevBlock: createTransaction.prevBlock, tokenId, type, newOwner };

  txData.signature = createSignTransaction( txData )

  console.log(txData.signature)

  let transactionResult;
  try {
    transactionResult = await sendTransaction( txData )
    console.log( transactionResult )
  } catch (e) {
    console.log(` GOT ERROR IN TRX CREATE ${ trxNubmer } `)
  }

  console.log( `>>>>>>>>>>>>>>>>>>>>>>>>>>>> TRX WAS CREATED ${ trxNubmer } <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n`)

  return transactionResult || {}
}

function createDeposit() {
  return deposit()
}

async function getPrevBlock() {

  let lastBlockNumber
  try {
    const lastBlock = await getLastBlock()
    lastBlockNumber = lastBlock.number
  } catch (e) {
    throw new Error(e)
  }

  return lastBlockNumber
}

module.exports = { createTransaction, createDeposit, getPrevBlock }
