#!/bin/bash
#https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options
set -e

declare VERBOSITY=${LOG_LEVEL:=1};

echo -e "geth start MAIN NETWORK log_level:${VERBOSITY}"

geth \
  --cache 4096 \
  --datadir "/root/.ethereum/main" \
  --verbosity ${VERBOSITY} \
  --ipcpath "/root/geth_ipc/geth.ipc" \
  --syncmode "fast" $@
