'use strict'

import net from 'net'
import Web3 from 'web3'
import config from '../config'
import fs from 'fs'

let web3;

if (config.web3WsProvider) {
  console.log(`Set WS WEB3 provider ${config.web3WsProvider}`);
  const getProvider = () => {
    const provider = new Web3.providers.WebsocketProvider(config.web3WsProvider);
    provider.on('connect', () => {
      console.log('WS Connected')
      provider.emit("restartWatchEvents");
    })
    provider.on('error', e => {
      console.error('WS Error', e)
      provider.emit("restartWatchEvents");
      web3.setProvider(getProvider())
    });
    provider.on('end', e => {
      console.error('WS End', e);
      provider.emit("restartWatchEvents");
      web3.setProvider(getProvider())

    });

    return provider
  };
  web3 = new Web3(getProvider())

} else {
  if (!fs.existsSync(config.gethIpc)) {
    throw new Error(`Not exists geth.ipc  ${config.gethIpc}`)
  }
  console.log(`Set WS WEB3 provider ${config.web3WsProvider}`);
  const provider = new Web3.providers.IpcProvider(config.gethIpc, net)
  web3 = new Web3(provider);
}


export default web3
