#!/bin/bash
#https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options
set -e

declare VERBOSITY=${LOG_LEVEL:=1};
declare GETH_OPTS;

if [[ -f /root/rinkeby/password && -s /root/rinkeby/password ]]; then
  GETH_OPTS='--password /root/rinkeby/password --keystore /root/rinkeby/keystore --unlock 0x49b7776ea56080439000fd54c45d72d3ac213020';
fi

echo -e "geth start rinkeby log_level:${VERBOSITY}"

geth \
  --rinkeby \
  --cache 2048 \
  --verbosity ${VERBOSITY} \
  --ipcpath "/root/geth_ipc/geth.ipc" \
  --rpc --rpcaddr 0.0.0.0 --rpcapi "db,eth,net,web3,personal" --rpccorsdomain "*" \
  --syncmode "fast" ${GETH_OPTS} $@
