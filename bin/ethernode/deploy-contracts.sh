#!/usr/bin/env bash

docker exec -ti plasma_backend_1 bash -c "babel-node ./app/lib/contracts/util/deployContracts.js"
