const { BrowserWindow, ipcMain } = require('electron');

const apiPrefix = 'window-';

ipcMain.handle(`${apiPrefix}minimize`, () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.handle(`${apiPrefix}toggleMaximize`, () => {
  const win = BrowserWindow.getFocusedWindow();

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.handle(`${apiPrefix}close`, () => {
  BrowserWindow.getFocusedWindow().close();
});
