#!/usr/bin/env bash

cd ..
docker-compose -p plasma -f docker-compose-dev.yml up $@
