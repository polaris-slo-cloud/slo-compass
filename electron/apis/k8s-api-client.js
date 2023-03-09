const { ipcMain, BrowserWindow } = require('electron');
const k8s = require('@kubernetes/client-node');
const request = require('request');
const { Watch } = require('@kubernetes/client-node');
const { v4: uuidv4 } = require('uuid');

const apiPrefix = 'k8s-';

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();
const watchRequests = new Map();

ipcMain.handle(`${apiPrefix}connectToContext`, (event, ctx) => {
  k8sConfig.setCurrentContext(ctx);
});
ipcMain.handle(`${apiPrefix}getContexts`, () => {
  return k8sConfig.getContexts();
});

ipcMain.handle(`${apiPrefix}read`, async (event, spec) => {
  try {
    const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
    const { body } = await k8sObjectApi.read(spec);
    return body;
  } catch (e) {
    return null;
  }
});
ipcMain.handle(`${apiPrefix}create`, async (event, resource) => {
  try {
    const k8sObjectApi = k8sConfig.makeApiClient(k8s.KubernetesObjectApi);
    const { body } = await k8sObjectApi.create(resource);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}patch`, async (event, resource) => {
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
});
ipcMain.handle(`${apiPrefix}test`, async () => {
  const api = k8sConfig.makeApiClient(k8s.CoreV1Api);
  try {
    await api.listNamespace();
    return true;
  } catch (e) {
    return false;
  }
});
ipcMain.handle(`${apiPrefix}listAllDeployments`, async (event, queryOptions) => {
  try {
    const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
    const { body } = await k8sAppsApi.listDeploymentForAllNamespaces(null, null, null, queryOptions?.labelSelector);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}listNamespacedDeployments`, async (event, namespace) => {
  try {
    const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
    const { body } = await k8sAppsApi.listNamespacedDeployment(namespace);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}getDeploymentStatus`, async (event, deployment) => {
  try {
    const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
    const { body } = await k8sAppsApi.readNamespacedDeploymentStatus(deployment.name, deployment.namespace);
    return body.status;
  } catch (e) {
    return null;
  }
});
ipcMain.handle(`${apiPrefix}listCustomResourceDefinitions`, async () => {
  try {
    const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
    const { body } = await k8sApiExtensionsApi.listCustomResourceDefinition();
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}findCustomResourceDefinition`, async (event, plural, apiGroup) => {
  try {
    const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
    const { body } = await k8sApiExtensionsApi.readCustomResourceDefinition(`${plural}.${apiGroup}`);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}getCustomResourceObject`, async (event, identifier) => {
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
});
ipcMain.handle(`${apiPrefix}listCustomResourceObjects`, async (event, objectKind, plural) => {
  try {
    const k8sCustomObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);
    const { body } = await k8sCustomObjectsApi.listClusterCustomObject(objectKind.group, objectKind.version, plural);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}deleteCustomResourceObject`, async (event, identifier) => {
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
});
ipcMain.handle(`${apiPrefix}findCustomResourceMetadata`, async (event, apiVersion, kind) => {
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
});
ipcMain.handle(`${apiPrefix}watch`, async (event, path, resourceVersion, watchQueryOptions) => {
  const watch = new Watch(k8sConfig);
  const queryOptions = watchQueryOptions ?? {};
  const options = { allowWatchBookmarks: true, ...queryOptions };
  if (resourceVersion) {
    options.resourceVersion = resourceVersion;
  }
  const key = uuidv4();
  const callbackTarget = event.sender;
  const watchCallback = (...params) => callbackTarget.send(`${apiPrefix}watchCallback-${key}`, ...params);
  const errorCallback = (...params) => callbackTarget.send(`${apiPrefix}errorCallback-${key}`, ...params);
  const watchRequest = await watch.watch(path, options, watchCallback, errorCallback);
  watchRequests.set(key, watchRequest);
  return key;
});
ipcMain.handle(`${apiPrefix}abortWatch`, (event, key) => {
  if (watchRequests.has(key)) {
    watchRequests.get(key).abort();
    watchRequests.delete(key);
  }
});
ipcMain.handle(`${apiPrefix}getDeployment`, async (event, namespace, name) => {
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
});
ipcMain.handle(`${apiPrefix}listClusterRoleBindings`, async () => {
  try {
    const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    const { body } = await k8sAuthorizationApi.listClusterRoleBinding();
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}listClusterRoles`, async () => {
  try {
    const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    const { body } = await k8sAuthorizationApi.listClusterRole();
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
ipcMain.handle(`${apiPrefix}findClusterRole`, async (event, name) => {
  try {
    const k8sAuthorizationApi = k8sConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    const { body } = await k8sAuthorizationApi.readClusterRole(name);
    return body;
  } catch (e) {
    throw new Error(e.body.message);
  }
});
