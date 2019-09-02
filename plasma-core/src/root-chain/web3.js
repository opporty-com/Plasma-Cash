'use strict'

import net from 'net'
import Web3 from 'web3'
import config from '../config'
import fs from 'fs'

let provider

if (config.web3WsProvider) {
  provider = new Web3.providers.WebsocketProvider(config.web3WsProvider)
} else {
  if (!fs.existsSync(config.gethIpc)) {
    throw new Error(`Not exists geth.ipc  ${config.gethIpc}`)
  }
  provider = new Web3.providers.IpcProvider(config.gethIpc, net)

}

let web3 = new Web3(provider)

export default web3
