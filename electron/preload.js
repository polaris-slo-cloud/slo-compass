const { contextBridge } = require('electron');
const { BrowserWindow, dialog } = require('@electron/remote');
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

contextBridge.exposeInMainWorld('polarisFileSystemAPI', {
  async openDirectory() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  },
});

contextBridge.exposeInMainWorld('k8sApi', k8sApiClient);
