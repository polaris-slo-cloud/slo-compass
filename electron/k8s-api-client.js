const k8s = require('@kubernetes/client-node');
const { KubernetesObject } = require('@kubernetes/client-node');
const { KubernetesPatchStrategies } = require('@/orchestrator/kubernetes/k8s-client-helper');

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();
const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);

module.exports = {
  connectToContext(ctx) {
    k8sConfig.setCurrentContext(ctx);
  },
  getContexts() {
    return k8sConfig.getContexts();
  },
  async read(spec) {
    try {
      const { body } = await k8sObjectApi.read(spec);
      return body;
    } catch (e) {
      return null;
    }
  },
  async create(resource) {
    const { body } = await k8sObjectApi.create(resource);
    return body;
  },
  async patch(resource) {
    const headers = {};
    // The ServiceMonitor type is not able to handle the default StrategicMergePatch
    if (resource.kind === 'ServiceMonitor') {
      headers['content-type'] = KubernetesPatchStrategies.MergePatch;
    }
    const { body } = await k8sObjectApi.patch(
      resource,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers }
    );
    return body;
  },
  async test() {
    const api = k8sConfig.makeApiClient(k8s.CoreV1Api);
    try {
      await api.listNamespace();
      return true;
    } catch (e) {
      return false;
    }
  },
  async listAllDeployments() {
    const { body } = await k8sAppsApi.listDeploymentForAllNamespaces();
    return body;
  },
  async getCustomResourceDefinitions() {
    const { body } = await k8sApiExtensionsApi.listCustomResourceDefinition();
    return body.items;
  },
  async getCustomResourceObjects(crd) {
    const { body } = await k8sCustomObjectsApi.listClusterCustomObject(
      crd.spec.group,
      crd.spec.versions[0].name,
      crd.spec.names.plural
    );
    return body.items;
  },
  async getDeployment(namespace, name) {
    try {
      const { body } = await k8sAppsApi.readNamespacedDeployment(name, namespace);
      return body;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  },
};
