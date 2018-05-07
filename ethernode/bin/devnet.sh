#!/bin/bash
#https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options
set -e

declare VERBOSITY=${LOG_LEVEL:=1};
declare DELETE_OLD_BLOCKCHAIN=${DELETE_OLD_BLOCKCHAIN:=1};
declare START_MINING=${MINING:=0};
declare GETH_OPTS;

if [[ DELETE_OLD_BLOCKCHAIN == 1 ]]; then
  echo 'rm /root/.ethereum/devnet/geth'
  rm -rf /root/.ethereum/devnet/geth
fi

if [[ START_MINING == 1 ]]; then
  GETH_OPTS='--mine --minerthreads 1';
  echo 'Start mining'
fi

echo 'geth init genesis.json'
geth \
  --datadir "/root/.ethereum/devnet" \
  --verbosity ${VERBOSITY} \
  --ipcpath "/root/geth_ipc/geth.ipc" \
  init "/root/devnet/genesis.json"

sleep 3

echo -e "geth start devnet log_level:${VERBOSITY}"

geth \
  --networkid 58546 \
  --rpcvhosts="*" \
  --nodiscover \
  --verbosity ${VERBOSITY} \
  --datadir "/root/.ethereum/devnet" \
  --keystore "/root/devnet/keystore" \
  --ipcpath "/root/geth_ipc/geth.ipc" \
  --maxpeers 0 \
  --rpc --rpcaddr 0.0.0.0 --rpcapi "db,eth,net,web3,personal" --rpccorsdomain "*" \
  --jspath "/root/devnet/" \
  --preload "preload.js" \
  --password "/root/devnet/password" \
#  --unlock 0 ${GETH_OPTS} $@
#  --ws --wsaddr 0.0.0.0 --wsapi "db,eth,net,web3,personal" --wsorigins "*" \
