#!/usr/bin/env bash

cd ..
docker-compose -p plasma -f docker-compose-test.yml up $@
