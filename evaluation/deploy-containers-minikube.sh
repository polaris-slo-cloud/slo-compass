#!/bin/bash
cd "$(dirname "$0")"

kubectl apply -f resources.yaml
kubectl apply -f polaris-components/apps/cost-efficiency/manifests/kubernetes-minikube
kubectl apply -f polaris-components/apps/cost-efficiency-slo-controller/manifests/kubernetes-minikube
kubectl apply -f polaris-cluster/horizontal-elasticity-strategy
for deployment in */deployment-minikube.yaml ; do kubectl apply -f $deployment ; done
for mapping in */metric-mapping.yaml ; do kubectl apply -f $mapping ; done
