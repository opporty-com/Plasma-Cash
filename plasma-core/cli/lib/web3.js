'use strict'

const Web3 = require('web3')
const config = require('../config')

let provider

try {
  if (config.web3HttpProvider) {
    provider = new Web3(new Web3.providers.HttpProvider(config.web3HttpProvider))
  }
} catch (error) {
  console.log(error)
}

let web3 = new Web3(provider)
web3.eth.net.isListening()

module.exports = web3
