import { logger } from '../app/lib/logger';
import { createSignedTransaction, getUTXO } from '../app/lib/tx';
import txPool from '../app/lib/txPool';
import { createDeposits } from '../app/lib/test';
import ethUtil from 'ethereumjs-util';
import TestTransactionsCreator from '../app/lib/txTestController';


const util = require('util');

function parseMulti(req, cb) {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        req.body = JSON.parse(Buffer.concat(body).toString());
        return cb();
    });
}
let parseM = util.promisify(parseMulti); 

class TxController {
    
    static createTestTransaction(req, res) {
      console.log('hello');
      res.end();
    }

    static async createTestDeposits(req, res) {
      await parseM(req);
      try { 
        let data = req.body;
        let count = data.count || null;
        console.log('count', count)
        return createDeposits({deposits: count})
          .then(ctreated => res.end( ctreated.toString() ))
      } catch(error) {
        res.statusCode = 400;
        res.end(error);
      }
    }

    static async getHashToSign(req, res) {
      try { 
        console.log('getHashToSign');
        await parseM(req);
        let data = req.body;
        let tx = await createSignedTransaction(data);
        let hashForSign = tx && ethUtil.addHexPrefix(tx.getHash(true).toString('hex'));
  
        return res.end(hashForSign);
      } catch(error) {
        res.end(error.toString());
      }
    }

    static createTestTransactions(req, res) {
      try { 
        return TestTransactionsCreator.createNewTransactions()
          .then(ctreated => {
            if (!ctreated) {
              res.statusCode = 400;
              return res.end();
            }
            res.statusCode = 200;
            return res.end();
          })
      }
      catch(error) {
        next(error);
      }
    }



    static async signed(req, res) {
      // console.log('signed')
      console.log('signedd');
      await parseM(req);

      console.log(req.body)
      try { 
        let data = req.body;
        let tx = await createSignedTransaction(data);

        if (!tx || !tx.validate()) {
          res.statusCode = 400;
          return res.end('invalid transaction');
        }

        let savedTx = await txPool.addTransaction(tx);
        if (!savedTx) {
          res.statusCode = 400;
          return res.end('invalid transaction');
        }

        return res.end(savedTx.getJson());
      } catch (error) {
        return logger.error('accept signed tx error: ', error);
      }
    }

}

export default TxController;
