/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-06
 * moonion.com;
 */
import { promiseFromEvent } from "../utils"
import { createSignTransaction } from '../helpers'
import config from '../config'

async function send( request, h ) {
  const { transaction } = request.payload,
    result = await promiseFromEvent({ action: "sendTransaction", payload: { transaction } });

  return result
}

async function createTransaction({ prevBlock, tokenId, to }) {
  const { address: from } = config

  if (!to) {
    console.log('"to" address is required! add -t, --to')
    process.exit(1);
  }

  if (!from) {
    console.log('add your address to config!')
    process.exit(1);
  }

  if (!prevBlock) {
    console.log('prevBlock is required! add -p, --prevBlock')
    process.exit(1);
  }

  if (!tokenId) {
    console.log('tokenId is required! add -u, --tokenId')
    process.exit(1);
  }

  const type = "pay",
        prevHash = '0x123',
        txData = { prevHash, prevBlock, tokenId, type, newOwner: to, from };

  txData.signature = createSignTransaction( txData )

  console.log( "Creating new transaction with params", txData )

  let result
  try {
    result = await promiseFromEvent({ action: "sendTransaction", payload: { transaction: txData } });
    console.log( "Transaction result ->", result )
  } catch( e  ) {
    console.log("Error:", e)
  }

  process.exit(1)

}

export { createTransaction }

