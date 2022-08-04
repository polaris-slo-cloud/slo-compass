const { contextBridge } = require('electron');
const { BrowserWindow, dialog } = require('@electron/remote');
const fs = require('fs/promises');
const k8sApiClient = require('./k8s-api-client');

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
});

contextBridge.exposeInMainWorld('k8sApi', k8sApiClient);
