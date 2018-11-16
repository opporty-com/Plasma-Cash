#!/usr/bin/env node
const comand = require('commander')
const {comandHandler, authentication} = require('./')

comand
  .command('* <type> [tokenId] [prevBlock] [address]')
  .action(async (type, tokenId, prevBlock, address)=>{
    console.log(await comandHandler({type, tokenId, prevBlock, address}))
  })

comand
  .command('authentication <privateKey>')
  .action(async (privateKey)=>{
    console.log(await authentication(privateKey))
  })

comand.parse(process.argv)
