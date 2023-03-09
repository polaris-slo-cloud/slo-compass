echo "Deleting Cost Efficiency SLO Mappings"
kubectl delete --all costefficiencyslomappings.slo.polaris-slo-cloud.github.io -A
echo "Deleting Horizontal Elasticitystrategy Mappings"
kubectl delete --all horizontalelasticitystrategies.elasticity.polaris-slo-cloud.github.io -A
kubectl get customresourcedefinitions.apiextensions.k8s.io -o custom-columns=":metadata.name" | grep slo.polaris-slo-cloud.github.io | grep -v costefficiencyslomappings.slo.polaris-slo-cloud.github.io | while read -r crd ; do
    echo "Deleting CRD $crd"
    kubectl delete --all $crd -A
    kubectl delete customresourcedefinitions.apiextensions.k8s.io $crd
done

echo "Resetting Polaris UI"
cd /home/user/evaluation-workspaces
i=0
while [ -e workspace-$i.pui ] ; do i=$((i+1)) ; done;

mv ../polaris-ui-workspace/workspace.pui ./workspace-$i.pui
mv /home/user/.config/polaris-ui/polaris-templates.json ./polaris-templates-$i.json
cd ..
cp evaluation/workspace.pui polaris-ui-workspace/workspace.pui
rm -rf polaris-cli-demo/smart-irrigation/