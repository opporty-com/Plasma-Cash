#!/usr/bin/env bash

cd ../../
docker-compose -p ethernode -f docker-compose.ethernode.yml -f docker-compose.ethernode-testing.yml up $@
