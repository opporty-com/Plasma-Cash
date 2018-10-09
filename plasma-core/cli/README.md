# Plasma-cash client instruments

[![N|Solid](http://i.piccy.info/i9/a978a2370040773428c44745f8857656/1531315538/44176/1257017/logo_007.png)](https://nodesource.com/products/nsolid)

This client provides most instrumental to able make behavior of validators, candidates and voters for consensus mechanism.

For perfom this, you need to `deploy main plasma server` and you should to open terminal and go to the folder as follow
```
dev-plasma-cash/plasma-cash/client
```
In you terminal now you be able to use yargs commands for participate in local consensus. You must to perfom main file with particular options that determine and perfom the action. command line with options look like this: 
```
babel-node index.js --action='add stake' --address='0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70' --candidate='0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8' --value=5
```
Other actions is follow describes.


## Deposit
Allows do create deposit and get the token_id of it
```
babel-node index.js --action='deposit' --address="0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70", --amount=4
```
response:
```
6146f6fd4624e1e3794732ef27fb5aca4260aa0dd2a487ae20c8487295c2fa30
```

## Create transaction 
```
babel-node index.js --action='create transaction' --address='0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70' --to='0x2AdC318Ac93A7289f83Ag7F26513bC0d15f0Ab3e' --token_id='6146f6fd4624e1e3794732ef27fb5aca4260aa0dd2a487ae20c8487295c2fa30'
```
response: 
```
{ prev_hash: '0x0123',
  prev_block: 1,
  token_id:
   '6146f6fd4624e1e3794732ef27fb5aca4260aa0dd2a487ae20c8487295c2fa30',
  new_owner:
   '0x2AdC318Ac93A7289f83Ag7F26513bC0d15f0Ab3e',
  signature:
   '0x7f6d530afa25dd45f7fe1c34ffb54400c5497e9eec29ee044b4707d81a2c984f6b7fa27a2129b2401514b239524043bf56af7a572f448bb83f6a7d3490c53b021c' }
```

## Get candidates
This action allows to view all candidates for validators in consensus
```
babel-node index.js --action='get candidates'
```
response looks like follow:
```
{ address: '0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8',
  stakes: [Array],
  weight: 8,
  isValidator: false },
{ address: '0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70',
  stakes: [Array],
  weight: 5,
  isValidator: false },
{ address: '0xE2201Ef12c3216750513F900fea533eeEa63e7EF',
  stakes: [],
  weight: 0,
  isValidator: false }
```

## Propose candidate
Allows to propose you candidate for validators
```
babel-node index.js --action='propose candidate' --address="0x2AdC318Ac93A7289f83AavF26513bC0d15f0Ab65"
```
response:
```
ok
```

## Remove candidate
Allows to remove self from list of candidates 
```
babel-node index.js --action='remove candidate' --address='0xE2201Ef12c3216750513F900fea533eeEa63e7EF'
```
response:
```
ok
```

## Add stake 
Allows voters to add stake for particular candidates
```
babel-node index.js --action='add stake' --address='0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70' --candidate='0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8' --value=5
```

## To lower or remove stake
Allows voters to lower their stake for particular candidates
```
babel-node index.js --action='lower stake' --address='0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70' --candidate='0x80ab44ca9381f931B687DB7f9B0C60F1169D6fb8' --value=2
```

## Validate
Allows validate and submit block to the plasma. If you are validator, that block will be included to the chain
```
babel-node index.js --action='validate' --address='0x2bf64b0ebd7ba3e20c54ec9f439c53e87e9d0a70'
```
response:
```
ok
```
