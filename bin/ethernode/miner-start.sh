#!/usr/bin/env bash

echo 'Start mining'
docker exec -ti ethernode_ethernode_1 geth --exec "miner.getHashrate() == 0 && miner.start(1)" attach ipc:/root/geth_ipc/geth.ipc
