'use strict'

import logger from 'lib/logger'
import {txMemPool, TXMemPool} from 'child-chain/TxMemPool'
import ethUtil from 'ethereumjs-util'
import {getBlock} from 'child-chain'
import {parseM} from 'lib/utils'
import web3 from 'lib/web3'
import {
  createSignedTransaction,
  checkTransaction,
  createDeposit,
  createTransaction,
  sendTransaction,
} from 'child-chain'

/** Class representing a transaction controller. */
class TxController {
  static async get(req, res) {
    await parseM(req)
    try {
      let {block: blockNumber, tokenId, getHash} = req.body
      if (!blockNumber || !tokenId) {
        res.statusCode = 400
        return res.end(JSON.stringify('Wrong request body'))
      }
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
      let {transaction} = req.body
      if (!transaction) {
        res.statusCode = 400
        return res.end('wrong request body')
      }
      let successfullTransaction =
        await createTransaction(transaction)
      return res.end(JSON.stringify(successfullTransaction))
    } catch (error) {
      res.statusCode = 500
      return res.end(JSON.stringify(error.toString()))
    }
  }

  static async sendTransaction(req, res) {
    await parseM(req)
    try {
      let {transaction} = req.body
      if (!transaction) {
        res.statusCode = 400
        return res.end('wrong request body')
      }
      let successfullTransaction =
        await sendTransaction(transaction)
      return res.end(JSON.stringify(successfullTransaction))
    } catch (error) {
      console.log(error)
      res.statusCode = 500
      return res.end(JSON.stringify(error.toString()))
    }
  }

  static async deposit(req, res) {
    await parseM(req)
    let {address, amount} = req.body || null
    if (!address || !amount ) {
      res.statusCode = 400
      return res.end(JSON.stringify({message: 'request body is wrong'}))
    }
    try {
      let answer = await createDeposit({address, amount})
      return res.end(JSON.stringify(answer))
    } catch (error) {
      res.statusCode = 400
      return res.end(error.toString())
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
      return res.end(error.toString())
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
    if (!address || !data) {
      res.statusCode = 400
      return res.end('wrong request body')
    }
    if (!web3.utils.isAddress(address)) {
      res.statusCode = 400
      return res.end(JSON.stringify('Incorrect address'))
    }
    web3.eth.sign(data, address).then((result) => {
    })
  }

  static async signVerify(req, res) {
    await parseM(req)
    let {signature, data} = req.body
    if (!signature || !data) {
      res.statusCode = 400
      return res.end('wrong request body')
    }
    web3.eth.personal.ecRecover(data, signature).then((result) => {
      return res.end(JSON.stringify(result))
    })
  }
}

export default TxController
