const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        },
        title: "Polaris UI",
    });

    // Production Environment
    if (app.isPackaged) {
        win.loadFile('dist/index.html');
    } else {
        win.loadURL(`http://localhost:3000`);
    }
}

app.whenReady().then(() => { 
    createWindow();

    // Open a new window if the app is activated again after closing all windows
    app.on("activate", () => {      
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } 
    });
});

// Quit the application on Windows and Linux if all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});