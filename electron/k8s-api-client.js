const k8s = require('@kubernetes/client-node');

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();
const k8sAppsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
const k8sObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);

module.exports = {
  async getCustomResourceDefinitions() {
    const { body } = await k8sAppsApi.listCustomResourceDefinition();
    return body.items;
  },
  async getCustomResourceObjects(crd) {
    const { body } = await k8sObjectsApi.listClusterCustomObject(
      crd.spec.group,
      crd.spec.versions[0].name,
      crd.spec.names.plural
    );
    return body.items;
  },
};
