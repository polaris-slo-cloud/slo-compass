const { app, BrowserWindow } = require('electron');
const { initialize, enable } = require('@electron/remote/main');
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer');
const path = require('path');

const createWindow = () => {
  initialize();
  const win = new BrowserWindow({
    width: 1500,
    height: 800,
    // taken from "public"
    icon: path.join(__dirname, 'icons', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    frame: false,
    title: 'Polaris UI',
  });
  enable(win.webContents);

  // Production Environment
  if (app.isPackaged) {
    win.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);
    // we're on production; no access to devtools pls
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
  } else {
    win.loadURL(`http://localhost:3000`);
  }
  win.maximize();
};

app.whenReady().then(() => {
  createWindow();
  if (!app.isPackaged) {
    installExtension(VUEJS3_DEVTOOLS);
  }
  // Open a new window if the app is activated again after closing all windows
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit the application on Windows and Linux if all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
