# API controllers tests

There are test cases for plasma api controllers


## Usage 

Go to  `bin/` directory

### Blocks test 
Run `test-api-block` for start blocks test.  
This test case include ( you can change params in `BLOCK_NUMBERS_ARRAY` constant ):
 - getBlock test ( by block number ) 
   - Should get block number `BLOCK_NUMBERS_ARRAY[number]`
 - getLastBlock test 
   - Should get last block
```
  ./run-some-test.sh "npm run test-api-block"
```

### Transaction test 
Run `test-api-transaction` for try create transaction test.  
This test case include ( you can change params in `TRX_ARRAY` and `TRX_HASH` constants ):
 - createTransaction
   - Should create Transaction where prevBlock is `TRX_ARRAY[prevBlock]`
 - getPool
   - Should get Pool
 - getTransactions ( by hash )
   - Should get transaction where hash is `TRX_HASH[index]`
   
```
  ./run-some-test.sh "npm run test-api-transaction"
```

### Token test 
Run `test-api-token` for get tokens.
This test case include ( you can change params in `TOKEN_IDS` and `TOKEN_ADDRESSES` constants ):
 - getToken ( by address )
   - Should get token by address -  `TOKEN_ADDRESSES[index]`
 - getToken ( by token id )
   - Should get token by token id -  `TOKEN_IDS[index]`
 - getLastTransaction ( by token )
    - Should get last transaction by token -  `TOKEN_IDS[index]`
 - getAllTransactions ( by token )
    - Should get last transaction by token -  `TOKEN_IDS[index]`     
```
  ./run-some-test.sh "npm run test-api-token"
```

### Validators tests
Run `test-api-validator` for start validators tests.
This test case include:
 - Validators
   - getCandidates
   - getValidators
   - getCurrent
```
  ./run-some-test.sh "npm run test-api-validator"
```

### Deposit test 
Run `test-api-deposit` for create deposit ( you can change deposit data in `DATA_FOR_DEPOSIT` constant ).  
```
 ./run-some-test.sh "npm run test-api-deposit"
```

### All tests
Run `test-api-run` for start all tests.
This command will run all tests above.  
```
  ./run-tests.sh 
```
