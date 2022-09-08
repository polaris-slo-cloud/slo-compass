const { contextBridge } = require('electron');
const { BrowserWindow, dialog } = require('@electron/remote');
const fs = require('fs/promises');
const k8sApiClient = require('./k8s-api-client');
const path = require('path');

contextBridge.exposeInMainWorld('polarisWindowAPI', {
  minimize() {
    BrowserWindow.getFocusedWindow().minimize();
  },

  toggleMaximize() {
    const win = BrowserWindow.getFocusedWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  },

  close() {
    BrowserWindow.getFocusedWindow().close();
  },
});

contextBridge.exposeInMainWorld('workspaceApi', {
  async openWorkspaceFile() {
    const files = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Workspace Configuration', extensions: ['json'] }],
    });
    if (!files) {
      return null;
    }
    const workspaceConfig = await fs.readFile(files[0]);
    return workspaceConfig.toJSON();
  },
  async save(workspace) {
    const workspaceJson = JSON.stringify(workspace);
    await fs.writeFile(workspace.location, workspaceJson);
  },
  async load(location) {
    const workspace = await fs.readFile(location, 'utf8');
    return JSON.parse(workspace);
  },
});

contextBridge.exposeInMainWorld('k8sApi', k8sApiClient);

contextBridge.exposeInMainWorld('filesApi', {
  async chooseDirectory() {
    const directory = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (directory.filePaths.length > 0) {
      return directory.filePaths[0];
    }
    return null;
  },
  combinePaths(...paths) {
    return path.join(...paths);
  },
});
