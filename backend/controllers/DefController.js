const util = require('util');
import { getAllUtxos } from '../app/lib/tx';
import redis from 'lib/redis';

function parseMulti(req, cb) {
  let body = [];
  req.on('data', (chunk) => {
      body.push(chunk);
  }).on('end', () => {
      if (body)
      try {
        req.body = JSON.parse(Buffer.concat(body).toString());
      } catch (e) {
        req.body = {};
      }
      return cb();
  });
}
let parseM = util.promisify(parseMulti); 

class DefController {

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

}

export default DefController;
