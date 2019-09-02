'use strict'

import net from 'net'
import Web3 from 'web3'
import config from '../config'
import fs from 'fs'

let web3;

if (config.web3WsProvider) {
  console.log(`Set WS WEB3 provider ${config.web3WsProvider}`);
  // provider = new Web3.providers.WebsocketProvider(config.web3WsProvider)
  web3 = new Web3(config.web3WsProvider)
} else {
  if (!fs.existsSync(config.gethIpc)) {
    throw new Error(`Not exists geth.ipc  ${config.gethIpc}`)
  }
  console.log(`Set WS WEB3 provider ${config.web3WsProvider}`);
  const provider = new Web3.providers.IpcProvider(config.gethIpc, net)
  web3 = new Web3(provider);
}


export default web3
