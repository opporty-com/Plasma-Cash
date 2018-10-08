'use strict'

import {logger} from 'lib/logger'
import {createSignedTransaction,
  checkTransaction, createDeposit, createTransaction} from 'child-chain'
import {txMemPool, TxMemPool} from 'child-chain/TxMemPool'
import ethUtil from 'ethereumjs-util'
import {getBlock} from 'child-chain/block'
import {parseM} from 'lib/utils'
import web3 from 'lib/web3'
import {validatorsQueue} from 'consensus'

/** Class representing a transaction controller. */
class TxController {
  static async get(req, res) {
    await parseM(req)
    try {
      let {block: blockNumber, tokenId, getHash} = req.body

      let block = await getBlock(blockNumber)
      if (!block) {
        res.statusCode = 404
        return res.end('Block not found')
      }

      let tx = block.getTxByTokenId(tokenId)

      if (!tx) {
        res.statusCode = 404
        return res.end('Tx not Found')
      }

      tx = getHash ? tx.getHash().toString('hex') : tx.getJson()

      return res.end(JSON.stringify(tx))
    } catch (error) {
      res.statusCode = 404
      return res.end('Error get tx' + error.toString())
    }
  }

  static async createTransaction(req, res) {
    await parseM(req)

    try {
      let {tokenId, addressFrom, addressTo} = req.body

      if (!tokenId || !addressFrom || !addressTo) {
        res.statusCode = 400
        return res.end('wrong request body')
      }

      let successfullTransaction =
        await createTransaction(tokenId, addressFrom, addressTo)

      return res.end(JSON.stringify(successfullTransaction))
    } catch (error) {
      console.error(error)
      res.statusCode = 500
      console.log('ERROR IN createTransaction', error);
      
      return res.end(JSON.stringify(error.toString()))
    }
  }

  static createTestTransaction(req, res) {
    let tx =
      testTransactionsCreator.alltransactions[parseInt(req.headers['test'])]
    return TxMemPool.acceptToMemoryPool(txMemPool, tx)
      .then((ctreated) => {
        if (!ctreated) {
          res.statusCode = 400
          return res.end()
        }
        return res.end(JSON.stringify(ctreated.getJson()))
      }).catch(function(e) {
        return res.end(e.toString())
      })
  }

  static async createTestDeposits(req, res) {
    await parseM(req)
    try {
      let data = req.body
      let count = data.count || null
      return createDeposits({deposits: count})
        .then((ctreated) => res.end(ctreated.toString()))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }

  static async deposit(req, res) {
    await parseM(req)
    let {address, password, amount} = req.body || null
    if (!address || !amount) {
      res.statusCode = 400
      res.end(JSON.stringify({message: 'request body is wrong'}))
    }
    try {
      let answer = await createDeposit({address, password, amount})
      res.end(JSON.stringify(answer))
    } catch (error) {
      res.statusCode = 400
      res.end(error.toString())
    }
  }

  static async getHashToSign(req, res) {
    await parseM(req)
    try {
      let data = req.body
      let tx = await createSignedTransaction(data)
      let hashForSign = tx &&
      ethUtil.addHexPrefix(tx.getHash(true).toString('hex'))

      return res.end(hashForSign)
    } catch (error) {
      res.end(error.toString())
    }
  }

  static async signed(req, res) {
    await parseM(req)

    try {
      let data = req.body
      let tx = await createSignedTransaction(data)

      if (!tx || !checkTransaction(tx)) {
        res.statusCode = 400
        return res.end('invalid transaction')
      }

      let savedTx = await TXMemPool.acceptToMemoryPool(txMemPool, tx)
      if (!savedTx) {
        res.statusCode = 400
        return res.end('invalid transaction')
      }
      return res.end(savedTx.getJson())
    } catch (error) {
      return logger.error('accept signed tx error: ', error)
    }
  }

  static async sign(req, res) {
    await parseM(req)

    let {address, data} = req.body
    web3.eth.sign(data, address).then((result) => {
    })
  }

  static async signVerify(req, res) {
    await parseM(req)

    let {signature, data} = req.body

    web3.eth.personal.ecRecover(data, signature).then((result) => {
      return res.end(JSON.stringify(result))
    })
  }
}

export default TxController
