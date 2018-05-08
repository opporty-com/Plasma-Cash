import net      from 'net';
import Web3     from 'web3';
import config from '../config';

let web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.254.152:8545"));

module.exports = web3;
