### Run tests (Smart contract code test) ###

```
ganache-cli --account="0x1fa1ab00c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9,10000000000000000000000000000000000000000000" --account="0x1fa1ab11c7e975e6dbe50781076b7c6c3130904c8bfaf9aeda98a9c6ef9938e9,10000000000000000000000000000000000000000000" --networkId=999 --port=8546
cd truffle/app
npm install
truffle test --network=test
```

## Request & Response Examples

### GET /utxo/

Example: http://localhost/utxo?address=0x11a618de3ade9b85cd811bf45af03bad481842ed

*  **URL Params**
```
 address=[string] return all utxo filtered by owner address
```
 
Response body:
```javascript
[
 {
   "prev_block": 0,
   "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
   "new_owner": "0x11a618de3ade9b85cd811bf45af03bad481842ed",
   "signature": "0x9845229c3f7a3b3a1c5979d91c0db84d20ac29c3df2bd4cd288dd3aec9ec075f523c2bb94b6c26747ad30525138d390054655ba192ca605fa336e699a2b29d661b",
   "blockNumber": 1
 }
]
```

### GET /utxoCount

Example: http://localhost/utxoCount

Response body:
```javascript
{
 "utxoCount": "250"
}
```

### GET /block/[id]

Example: http://localhost/block/get/1

Response body:
```javascript

{
 "blockNumber": 1,
 "merkleRootHash": "eb997bad9ba36496b4c78f1eb292176a06ea2d33ae4fe84b514f066e8c11be2b",
 "transactions": [
   {
     "prev_block": 0,
     "token_id": "85361955844800290802551163085565397049851884903525530293420604591556133442855",
     "new_owner": "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe",
     "signature": "0x392df7e071a4e7f1569237cb7c465d7d644cda2252bd8893c0d847203619d5507d1a5d9978eea508eb8f43847d6e3126ad567af68909ae336cf63c61961d277a1b"
   },
   {
     "prev_block": 0,
     "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
     "new_owner": "0x11a618de3ade9b85cd811bf45af03bad481842ed",
     "signature": "0x9845229c3f7a3b3a1c5979d91c0db84d20ac29c3df2bd4cd288dd3aec9ec075f523c2bb94b6c26747ad30525138d390054655ba192ca605fa336e699a2b29d661b"
   }
 ]
}
```

### POST /block/proof

Example: http://localhost/block/proof?block=1&token_id=6595446839462728333343449079459300500808965641044370550270962527014110948362

 **Required:**
```
 block=[integer] Block number
 token_id=[string] Transaction TokenId
```

Response body:
```javascript
{
 "proof": "01000000000000000000000000000000000000000000000000000000000000000000ad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597b...64ba963b70"
}
```

### GET /block/checkProof

Example: http://localhost/block/checkProof

*  **URL Params**
 **Required:**
```
 block=[integer] Block number
 hash=[string] Transaction hash
 proof=[string] Merkle proof of existence
```
  
Request body:

```javascript
{ "block":1,
 "hash": "77771d855eddf6971a72f3a81b1c38d1f164268a5beee49fea7d0da0ec9def8a",
 "proof": "01000000000000000000000000000000000000000000000000000000000000000000ad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597b...64ba963b70"
}
```
Response body:
```javascript
{
 "message": true
}
```

### GET /tx

Example: http://localhost/tx?block=1&token_id=6595446839462728333343449079459300500808965641044370550270962527014110948362

*  **URL Params**
```
 getHash=[boolean] Return Transaction Merkle hash
```
 **Required:**
```
 block=[integer] Block number
 token_id=[string] Transaction TokenId
```

Response body:
```javascript
{
 "prev_block": 0,
 "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
 "new_owner": "0x11a618de3ade9b85cd811bf45af03bad481842ed",
 "signature": "0x9845229c3f7a3b3a1c5979d91c0db84d20ac29c3df2bd4cd288dd3aec9ec075f523c2bb94b6c26747ad30525138d390054655ba192ca605fa336e699a2b29d661b"
}
```

### POST /tx/getHashToSign/

Example: http://localhost/tx/getHashToSign

*  **URL Params**
 **Required:**
``` 
   prev_hash=[string] utxo Transaction hash
   prev_block=[integer] New block number
   token_id=[string] Transaction TokenId
   new_owner=[string] New utxo owner address
```

Request body:
```javascript
{
 "prev_hash": "0caa05a05d88d6a531f4876ec0447e073cd67ef3512f8f1b9dbfc5e4eca6b044",
 "prev_block": 1,
 "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
 "new_owner": "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe"
}
```
Response body:
```javascript
"0xd6329448836107a349bcfaa40c3294c33d994ed7c989343ce4b64675252bc5b6"
```

### POST /tx/signed/

Example: http://localhost/tx/signed

*  **URL Params**

 **Required:**
``` 
   prev_block=[integer] New block number
   token_id=[string] Transaction TokenId
   new_owner=[string] New utxo owner address
   signature=[string] Transaction signature
```

Request body:
```javascript
{
 "prev_hash": "0caa05a05d88d6a531f4876ec0447e073cd67ef3512f8f1b9dbfc5e4eca6b044",
 "prev_block": 1,
 "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
 "new_owner": "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe",
 "signature": "0x51119fc358f4aa9656a574ee74f1ccce1517543f341d3da9556230f4020928fe26046adfcfe3ed5308c713a816b9971632b08fb40c84ed64e1e477d7fd7db77b1b"
}
```
Response body:

```javascript
{
 "prev_hash": "0x0caa05a05d88d6a531f4876ec0447e073cd67ef3512f8f1b9dbfc5e4eca6b044",
 "prev_block": 1,
 "token_id": "6595446839462728333343449079459300500808965641044370550270962527014110948362",
 "new_owner": "0xa5fe0deda5e1a0fcc34b02b5be6857e30c9023fe",
 "signature": "0x51119fc358f4aa9656a574ee74f1ccce1517543f341d3da9556230f4020928fe26046adfcfe3ed5308c713a816b9971632b08fb40c84ed64e1e477d7fd7db77b1b"
}
```


