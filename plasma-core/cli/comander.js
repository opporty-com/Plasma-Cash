#!/usr/bin/env node
const comand = require('commander');
const {comandHandler} = require('./')

comand
  .command(`* <type> [tokenId] [blockNubmer] [address]`)
  .action(async (type, tokenId, blockNumber, address)=>{
  console.log(await comandHandler({type, tokenId, blockNumber, address}))
})

program.parse(process.argv)
