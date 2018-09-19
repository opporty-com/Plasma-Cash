
'use strict';

import { getAllUtxos } from 'child-chain';
import redis from 'lib/storage/redis';
import { parseM } from 'lib/utils';

class DefController {
  static async deposits(req, res) {
    await parseM(req);
    try {
      let deposits = [];

      redis.keys('tokenId*', function(err, result) {
        if (err) {
          res.statusCode = 400;
          return res.end('error');
        }
        redis.mget(result, function(err2, res2) {
          deposits = result;
          res.statusCode = 200;
          return res.end(JSON.stringify(deposits));
        })
      })
    } catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async utxo(req, res) {
    await parseM(req);
    try { 
      let data = req.body;    
      let options = {...data, json: true };
      let utxos = await getAllUtxos(options);
      res.statusCode = 200;
      res.end(JSON.stringify(utxos));
    }
    catch(error){
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async utxoCount(req, res) {
    try { 
      redis.keys('utxo*', function(err, result) {
        res.statusCode = 200;
        res.end(result.length.toString());
      })
    } catch(error){
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async getRawMempool(req, res) {
    try { 
      let all = await redis.hgetallAsync('txpool');
      res.statusCode = 200;
      res.end(JSON.stringify(all));
      
    } catch(error){
      res.statusCode = 400;
      res.end(error.toString());
    }

  }

}

export default DefController;
