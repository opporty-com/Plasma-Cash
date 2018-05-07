#!/bin/bash
#https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options
set -e

declare VERBOSITY=${LOG_LEVEL:=1};
declare GETH_OPTS;

if [[ -f /root/rinkeby/password && -s /root/rinkeby/password ]]; then
  GETH_OPTS='--password /root/rinkeby/password --keystore /root/rinkeby/keystore --unlock 0x11a618de3ade9b85cd811bf45af03bad481842ed';
fi

echo -e "geth start rinkeby log_level:${VERBOSITY}"

geth \
  --rinkeby \
  --cache 2048 \
  --verbosity ${VERBOSITY} \
  --ipcpath "/root/geth_ipc/geth.ipc" \
  --rpc --rpcaddr 0.0.0.0 --rpcapi "db,eth,net,web3,personal" --rpccorsdomain "*" \
  --syncmode "fast" ${GETH_OPTS} $@
