#!/usr/bin/env bash

docker exec -ti plasma_backend_1 bash -c "rm -rf /usr/src/contracts/dist && babel-node ./app/lib/contracts/util/build-contracts.js"
