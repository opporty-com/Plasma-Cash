/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-12
 * moonion.com;
 */

import { promiseFromEvent } from "../utils"

const getByAddress = async ({ address }) => {

  if ( !address ) {
    console.log('address is required! add -a, --address')
    process.exit(1);
  }

  console.log( `Balance action running by ${address} address` )

  let balance
  try {
    balance = await promiseFromEvent({ action: "getTokenByAddress", payload: address });
    console.log("Balance ->", balance)
  } catch (e) {
    console.log("Error: ", e)
  }


  process.exit(1)

}


export { getByAddress }
