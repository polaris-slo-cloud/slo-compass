const k8s = require('@kubernetes/client-node');
const request = require('request');
const { Watch } = require('@kubernetes/client-node');
const { v4: uuidv4 } = require('uuid');
const {NamespacedObjectReference} = require("@polaris-sloc/core");

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();
const watchRequests = new Map();

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
    try {
      const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
      const { body } = await k8sObjectApi.create(resource);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async patch(resource) {
    try {
      const headers = {};
      // The ServiceMonitor type and Polaris Custom Objects are not able to handle the default StrategicMergePatch
      if (resource.kind === 'ServiceMonitor' || resource.apiVersion.includes('polaris')) {
        headers['content-type'] = 'application/merge-patch+json';
      }
      const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
      const { body } = await k8sObjectApi.patch(resource, undefined, undefined, undefined, undefined, { headers });
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
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
  async listAllDeployments(queryOptions) {
    try {
      const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
      const { body } = await k8sAppsApi.listDeploymentForAllNamespaces(null, null, null, queryOptions.labelSelector);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async listNamespacedDeployments(namespace) {
    try {
      const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
      const { body } = await k8sAppsApi.listNamespacedDeployment(namespace);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async getDeploymentStatus(deployment) {
    try {
      const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
      const { body } = await k8sAppsApi.readNamespacedDeploymentStatus(deployment.name, deployment.namespace);
      return body.status;
    } catch (e) {
      return null;
    }
  },
  async listCustomResourceDefinitions() {
    try {
      const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
      const { body } = await k8sApiExtensionsApi.listCustomResourceDefinition();
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async findCustomResourceDefinition(plural, apiGroup) {
    try {
      const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
      const { body } = await k8sApiExtensionsApi.readCustomResourceDefinition(`${plural}.${apiGroup}`);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async getCustomResourceObject(identifier) {
    try {
      const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
      const { body } = await k8sCustomObjectsApi.getNamespacedCustomObject(
        identifier.group,
        identifier.version,
        identifier.namespace,
        identifier.plural,
        identifier.name
      );
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async listCustomResourceObjects(objectKind, plural) {
    try {
      const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
      const { body } = await k8sCustomObjectsApi.listClusterCustomObject(objectKind.group, objectKind.version, plural);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async deleteCustomResourceObject(identifier) {
    try {
      const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
      await k8sCustomObjectsApi.deleteNamespacedCustomObject(
        identifier.group,
        identifier.version,
        identifier.namespace,
        identifier.plural,
        identifier.name
      );
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async findCustomResourceMetadata(apiVersion, kind) {
    const api = apiVersion.includes('/') ? 'apis' : 'api';
    const baseUrl = [api, apiVersion].join('/');
    const opts = {};
    await k8sConfig.applyToRequest(opts);
    const data = await new Promise((resolve, reject) => {
      // TODO: Use fetch once the K8s JS Api has been migrated to fetch
      request.get(`${k8sConfig.getCurrentCluster().server}/${baseUrl}`, opts, (error, response, body) => {
        if (error) {
          reject(error);
        }
        if (response) {
          console.log(`statusCode: ${response.statusCode}`);
        }
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve(null);
        }
      });
    });
    return data.resources.find((x) => x.kind === kind);
  },
  async watch(path, resourceVersion, watchCallback, errorCallback) {
    const watch = new Watch(k8sConfig);
    const options = { allowWatchBookmarks: true };
    if (resourceVersion) {
      options.resourceVersion = resourceVersion;
    }
    const watchRequest = await watch.watch(path, options, watchCallback, errorCallback);
    const key = uuidv4();
    watchRequests.set(key, watchRequest);
    return key;
  },
  abortWatch(key) {
    if (watchRequests.has(key)) {
      watchRequests.get(key).abort();
      watchRequests.delete(key);
    }
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
      throw new Error(e.body.message);
    }
  },
  async listClusterRoleBindings() {
    try {
      const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
      const { body } = await k8sAuthorizationApi.listClusterRoleBinding();
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async listClusterRoles() {
    try {
      const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
      const { body } = await k8sAuthorizationApi.listClusterRole();
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
  async findClusterRole(name) {
    try {
      const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
      const { body } = await k8sAuthorizationApi.readClusterRole(name);
      return body;
    } catch (e) {
      throw new Error(e.body.message);
    }
  },
};
