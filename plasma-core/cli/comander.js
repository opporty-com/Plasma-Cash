#!/usr/bin/env node
const comand = require('commander')
const {comandHandler, authentication, logout} = require('./')

comand
  .command('* <type> [tokenId] [blockNubmer] [address]')
  .action(async (type, tokenId, blockNumber, address)=>{
    console.log(await comandHandler({type, tokenId, blockNumber, address}))
  })

comand
  .command('authentication <privateKey> <password>')
  .action(async (privateKey, password)=>{
    console.log(await authentication(privateKey, password))
  })

comand.parse(process.argv)
