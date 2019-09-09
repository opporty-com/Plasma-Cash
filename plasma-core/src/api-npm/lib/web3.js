'use strict'

const net = require('net')
const Web3 = require('web3')
const config = require('../config')
const fs = require('fs')

let provider
if (config.web3HttpProvider) {
  provider = new Web3(new Web3.providers.HttpProvider(config.web3HttpProvider))
} else {
  if (!fs.existsSync(config.gethIpc)) {
    throw new Error(`Not exists geth.ipc  ${config.gethIpc}`)
  }
  provider = new Web3(new Web3.providers.IpcProvider(config.gethIpc, net))

}

let web3 = new Web3(provider)
web3.eth.net.isListening()

module.exports = web3
