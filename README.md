# Plasma Cash

Opporty Plasma Cash contains a set of smart contracts and microservices performing Node functions. You can run it on different servers. Each microservice has an API with documentation. There is also a CLI. Plasma Cash allows you to conduct public and private transactions using the zk-snark tool. You can confidentially transfer standard ERC-20 and ERC-721 tokens within the Ethereum blockchain.

Please note that this technology is still in a test mode and needs more profound elaboration to be released as a ready-made product. We continue working on Plasma Cash and searching for advanced solutions that can make our innovative project even better.
We have shared news about Plasma Cash with the purpose of stimulating the adoption of public blockchains. We want to show to the community that progressive projects are being developed in this industry and it deserves close attention. 
Also, we use the comments of those who have checked out our solution as guidelines for further work. Your feedback, both positive and negative, is very important for us. If the current version of Plasma Cash simplifies your work, this proves our efforts were not made in vain. If you find some drawbacks, be sure to inform us about them. Thus you will help our project evolve and grow. 

**We do not recommend using the prototype for the processing of classified data and the transfer of funds since it has not yet passed a security check. We do not undertake responsibility for damage caused by the failures of this version, so you should better test it on minor tasks.**

# Getting started

The guidelines below should give you a clear idea of how to conduct the Nightfall setup and start using Plasma Cash. Since significant computing resources are needed, you should better opt for a high-end processor. The setup would last from one to a couple of hours, depending on your equipment. 

# Supported hardware & prerequisites

Mac and Linux machines with at least 64GB of memory and 512GB of disk space are supported.

The Opporty Plasma Cash demonstration requires the following software to run:
- Docker
  - Launch Docker Desktop (on Mac, it is on the menu bar) and set memory to 8GB with 4GB of swap space (minimum - 12GB memory is better) or 16GB of memory with 512MB of swap. The default values for Docker Desktop will NOT work. No, they really won't.
  - https://docs.docker.com/install/linux/docker-ce/debian/

**Docker compose https://docs.docker.com/compose/install/**
 
# Installing Opporty Plasma Cash

Clone the Plasma Cash repository and use a terminal to enter the directory.
1. `git clone https://github.com/opporty-com/Plasma-Cash.git plasma`

2. `cd plasma`


Set up a test Ether Node. 

3. `cd plasma/bin/ethernode/`

4. `./up-dev.sh -d`

Set up a smart contract. 

5. `./migration-dev.sh`

Launch Plasma.

6. Copy example docker-compose.yml  
`cp plasma/docker-compose.override.example.yml plasma/docker-compose.override.yml`
`cp plasma/docker-compose.example.yml plasma/docker-compose.yml`

7. Change contract address into `plasma/docker-compose.override.yml` which has been received on previous steps and ip address your server file
```
Root: 0xe40d2fee1554cd536c630bf5af30fdfe97f924de
```


8. `cd plasma/bin`

9. `./up.sh -d`

Run demo. 

10. `cd plasma`

11. `docker-compose exec mainnode npm run demo`  

# To run API controllers tests

There are test cases for plasma api controllers


## Usage 

Go to  `bin/` directory

## Api documentation
`http://localhost:55555/documentation`

## Blocks test 
Run `test-api-block` for start blocks test.  
This test case include ( you can change params in `BLOCK_NUMBERS_ARRAY` constant ):
 - getBlock test ( by block number ) 
   - Should get block number `BLOCK_NUMBERS_ARRAY[number]`
 - getLastBlock test 
   - Should get last block
```
  ./run-some-test.sh "npm run test-api-block"
```

## Transaction test 
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

## Token test 
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

## Validators tests
Run `test-api-validator` for start validators tests.
This test case include:
 - Validators
   - getCandidates
   - getValidators
   - getCurrent
```
  ./run-some-test.sh "npm run test-api-validator"
```

## Deposit test 
Run `test-api-deposit` for create deposit ( you can change deposit data in `DATA_FOR_DEPOSIT` constant ).  
```
 ./run-some-test.sh "npm run test-api-deposit"
```

## All tests
Run `test-api-run` for start all tests.
This command will run all tests above.  
```
  ./run-tests.sh 
```

## CLI

Go to  `bin/` directory

```bash
./cli.sh -h
```