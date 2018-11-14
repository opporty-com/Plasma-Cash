#!/usr/bin/env node
const comand = require('commander')
const {comandHandler, authentication} = require('./')

comand
  .command('* <type> [tokenId] [prevBlock] [address]')
  .action(async (type, tokenId, prevBlock, address)=>{
    console.log(await comandHandler({type, tokenId, prevBlock, address}))
  })

comand
  .command('authentication <privateKey> <password>')
  .action(async (privateKey, password)=>{
    console.log(await authentication(privateKey, password))
  })

comand.parse(process.argv)
