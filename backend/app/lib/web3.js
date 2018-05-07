import net      from 'net';
import Web3     from 'web3';
import config from '../config';

let web3 = new Web3(new Web3.providers.IpcProvider(config.gethIpc, net));

module.exports = web3;
