#!/usr/bin/env bash

cd ..
docker-compose -p plasma exec mainnode $@
