# API controllers tests

There are test cases for plasma api controllers


## Usage 

Go to  `bin/` directory

### Deposit test 
Run `token-create-deposit` for create deposit (you can change deposit data in `DATA_FOR_DEPOSIT` constant).  
```
 ./run-some-test.sh "npm run test-token-create-deposit"
```

### Changing token's owner test 
Run `token-change-owner` to change it's owner.
```
 ./run-some-test.sh "npm run test-token-change-owner"
```

### Exit token test 
Run `token-exit` to exit active token from it's owner.  
```
 ./run-some-test.sh "npm run test-token-exit"
```

### Deposit test 
Run `voting-for-candidate` to create deposit on candidate and make it, and create enough deposits to vote for candidate on another address.
After all candidate should be an operator.  
```
 ./run-some-test.sh "npm run test-voting-for-candidate"
```

### All tests
Run `run-all` for start all tests.
This command will run all tests above.
```
  ./run-tests.sh 
```
