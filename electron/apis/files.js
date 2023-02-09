const { ipcMain, dialog } = require('electron');
const path = require('path');

const apiPrefix = 'files-';

ipcMain.handle(`${apiPrefix}chooseDirectory`, async () => {
  const directory = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (directory.filePaths.length > 0) {
    return directory.filePaths[0];
  }
  return null;
});
ipcMain.handle(`${apiPrefix}combinePaths`, (event, ...paths) => {
  return path.join(...paths);
});
