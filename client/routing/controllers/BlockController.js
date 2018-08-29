'use strict';

import { getBlock } from 'child-chain/block';
import { submitBlock } from 'child-chain';
import { parseM } from 'lib/utils';
import { validateKeyForMining, stateValidators, minersQueue, initConsensus } from 'consensus'

initConsensus()

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
    } catch (error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async proposeCandidate(req, res) {
    await parseM(req);
    try {
      let { address } = req.body;
      let answer = await stateValidators.setCandidate(address)
      res.end(JSON.stringify({ answer }))
    }
    catch (error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }

  static async submitBlock(req, res){
    await parseM(req);

    let { address, password, miner_key } = req.body;

    if(!(await validateKeyForMining({miner_key, address}))){
      console.log('key is not valid');
      res.statusCode = 403;
      return res.end(JSON.stringify({message: "is not in validators queue"}))
    }

    let current_miner = await minersQueue.getCurrentMiner()

    if(current_miner.address != address){
      res.statusCode = 409;
      return res.end(JSON.stringify({message: "wait for the validator queue"}))
    }
    
    let answer = await submitBlock(address, password) // + blockHash

    await minersQueue.setNextMiner()
    
    console.log('Next current miner: ', await minersQueue.getCurrentMiner());
     
    return res.end(JSON.stringify({ answer }));
    
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
    catch (error) {
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
    catch (error) {
      res.statusCode = 400;
      res.end(error.toString());
    }
  }
}

export default BlockController;