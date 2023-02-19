#!/bin/bash
cd "$(dirname "$0")"

kubectl apply -f resources.yaml
kubectl apply -f polaris-components/apps/cost-efficiency/manifests/kubernetes
kubectl apply -f polaris-cluster/cost-efficiency-slo
kubectl apply -f polaris-cluster/horizontal-elasticity-strategy
for deployment in */deployment.yaml ; do kubectl apply -f $deployment ; done
for mapping in */metric-mapping.yaml ; do kubectl apply -f $mapping ; done