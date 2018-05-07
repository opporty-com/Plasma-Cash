#!/usr/bin/env bash

./miner-start.sh
sleep 10
docker exec -i ethernode_truffle_1 truffle migrate --network development --reset $@
#sleep 10
#./miner-stop.sh
