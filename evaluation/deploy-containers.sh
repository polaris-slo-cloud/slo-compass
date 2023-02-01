#!/bin/bash
cd "$(dirname "$0")"

kubectl apply -f resources.yaml
for deployment in */deployment.yaml ; do kubectl apply -f $deployment ; done