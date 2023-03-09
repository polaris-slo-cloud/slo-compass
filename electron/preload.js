const { contextBridge, ipcRenderer } = require('electron');

const apis = {
  polarisWindowAPI: {
    apiPrefix: 'window',
    features: ['minimize', 'toggleMaximize', 'close'],
  },
  workspaceApi: {
    apiPrefix: 'workspace',
    features: ['openWorkspaceFile', 'save', 'load'],
  },
  templatesApi: {
    apiPrefix: 'templates',
    features: ['saveTemplates', 'loadTemplates'],
  },
  filesApi: {
    apiPrefix: 'files',
    features: ['chooseDirectory', 'combinePaths'],
  },
  k8sApi: {
    apiPrefix: 'k8s',
    features: [
      'connectToContext',
      'getContexts',
      'read',
      'create',
      'patch',
      'test',
      'listAllDeployments',
      'listNamespacedDeployments',
      'getDeploymentStatus',
      'listCustomResourceDefinitions',
      'findCustomResourceDefinition',
      'getCustomResourceObject',
      'listCustomResourceObjects',
      'deleteCustomResourceObject',
      'findCustomResourceMetadata',
      'watch',
      'abortWatch',
      'getDeployment',
      'listClusterRoleBindings',
      'listClusterRoles',
      'findClusterRole',
    ],
    featureInvokers: {
      async watch(path, resourceVersion, watchCallback, errorCallback) {
        const watchKey = await ipcRenderer.invoke('k8s-watch', path, resourceVersion);
        ipcRenderer.on(`k8s-watchCallback-${watchKey}`, (event, ...params) => watchCallback(...params));
        ipcRenderer.on(`k8s-errorCallback-${watchKey}`, (event, ...params) => errorCallback(...params));
      },
    },
  },
};

for (const apiKey of Object.keys(apis)) {
  const api = {};
  for (const feature of apis[apiKey].features) {
    if (apis[apiKey].featureInvokers && apis[apiKey].featureInvokers[feature]) {
      api[feature] = apis[apiKey].featureInvokers[feature];
    } else {
      api[feature] = (...params) => ipcRenderer.invoke(`${apis[apiKey].apiPrefix}-${feature}`, ...params);
    }
  }
  contextBridge.exposeInMainWorld(apiKey, api);
}

/*
contextBridge.exposeInMainWorld('polarisWindowAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window-toggleMaximize'),
  close: () => ipcRenderer.invoke('window-close'),
});

contextBridge.exposeInMainWorld('workspaceApi', {
  openWorkspaceFile: async () => ipcRenderer.invoke('workspace-openWorkspaceFile'),
  save: async (workspace) => ipcRenderer.invoke('workspace-save', workspace),
  load: async (location) => ipcRenderer.invoke('workspace-load', location),
});

contextBridge.exposeInMainWorld('templatesApi', {
  saveTemplates: async (templates) => ipcRenderer.invoke('templates-saveTemplates', templates),
  loadTemplates: async () => ipcRenderer.invoke('templates-loadTemplates'),
});

contextBridge.exposeInMainWorld('filesApi', {
  chooseDirectory: async () => ipcRenderer.invoke('files-chooseDirectory'),
  combinePaths: (...paths) => ipcRenderer.invoke('files-combinePaths', ...paths),
});

contextBridge.exposeInMainWorld('k8sApi', {

});*/
