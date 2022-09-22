const k8s = require('@kubernetes/client-node');
const request = require('request');

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();

module.exports = {
  connectToContext(ctx) {
    k8sConfig.setCurrentContext(ctx);
  },
  getContexts() {
    return k8sConfig.getContexts();
  },
  async read(spec) {
    try {
      const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
      const { body } = await k8sObjectApi.read(spec);
      return body;
    } catch (e) {
      return null;
    }
  },
  async create(resource) {
    const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
    const { body } = await k8sObjectApi.create(resource);
    return body;
  },
  async patch(resource) {
    const headers = {};
    // The ServiceMonitor type and Polaris Custom Objects are not able to handle the default StrategicMergePatch
    if (resource.kind === 'ServiceMonitor' || resource.apiVersion.includes('polaris')) {
      headers['content-type'] = 'application/merge-patch+json';
    }
    const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
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
    const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
    const { body } = await k8sAppsApi.listDeploymentForAllNamespaces();
    return body;
  },
  async listCustomResourceDefinitions() {
    const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
    const { body } = await k8sApiExtensionsApi.listCustomResourceDefinition();
    return body;
  },
  async getCustomResourceObject(identifier) {
    const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
    const { body } = await k8sCustomObjectsApi.getNamespacedCustomObject(
      identifier.group,
      identifier.version,
      identifier.namespace,
      identifier.plural,
      identifier.name
    );
    return body;
  },
  async deleteCustomResourceObject(identifier) {
    const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
    await k8sCustomObjectsApi.deleteNamespacedCustomObject(
      identifier.group,
      identifier.version,
      identifier.namespace,
      identifier.plural,
      identifier.name
    );
  },
  async findCustomResourceMetadata(crdObject) {
    const api = crdObject.apiVersion.includes('/') ? 'apis' : 'api';
    const baseUrl = [api, crdObject.apiVersion].join('/');
    const opts = {};
    await k8sConfig.applyToRequest(opts);
    const data = await new Promise((resolve, reject) => {
      // TODO: Use fetch once the K8s JS Api has been migrated to fetch
      request.get(
        `${k8sConfig.getCurrentCluster().server}/${baseUrl}`,
        opts,
        (error, response, body) => {
          if (error) {
            reject(error);
          }
          if (response) {
            console.log(`statusCode: ${response.statusCode}`);
          }
          resolve(JSON.parse(body));
        }
      );
    });
    return data.resources.find((x) => x.kind === crdObject.kind);
  },
  async getDeployment(namespace, name) {
    try {
      const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
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
