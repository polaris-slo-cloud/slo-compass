echo "Deleting Cost Efficiency SLO Mappings"
kubectl delete --all costefficiencyslomappings.slo.polaris-slo-cloud.github.io
echo "Deleting Horizontal Elasticitystrategy Mappings"
kubectl delete --all horizontalelasticitystrategies.elasticity.polaris-slo-cloud.github.io
kubectl get customresourcedefinitions.apiextensions.k8s.io -o custom-columns=":metadata.name" | grep slo.polaris-slo-cloud.github.io | grep -v costefficiencyslomappings.slo.polaris-slo-cloud.github.io | while read -r crd ; do
    echo "Deleting CRD $crd"
    kubectl delete --all $crd
    kubectl delete customresourcedefinitions.apiextensions.k8s.io $crd
done
## TODO: Delete Resources for Polaris CLI Demo