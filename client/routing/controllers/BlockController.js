'use strict';

import { getBlock } from 'child-chain/block';
import { parseM } from 'lib/utils';

class BlockController {
  static async get(req, res) {
    try {
      let params = req.url.split('/');
      const blockNumber = parseInt(params[3]);
      if (!blockNumber) {
        res.statusCode = 400;
        return res.end("Invalid block number");
      }
      let block = await getBlock(blockNumber);
      return res.end(JSON.stringify(block.getJson()));
    } catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async proof(req, res) {
    await parseM(req);
    try { 
      let { block: blockNumber, token_id } = req.body;
      if (!blockNumber) {
        throw new Error('No block number in request');
      }
      let block = await getBlock(blockNumber);
      let proof = block.getProof(token_id, true)

      return res.end(JSON.stringify({ proof }));
    }
    catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async checkProof(req, res) {
    await parseM(req);
    try { 
      let { block: blockNumber, hash, proof } = req.body;
      let block = await getBlock(blockNumber);
      return res.end(JSON.stringify(block.checkProof(proof, hash)));
    }
    catch(error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

}

export default BlockController;