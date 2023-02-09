const { dialog, ipcMain } = require('electron');
const fs = require('fs/promises');

const apiPrefix = 'workspace-';

ipcMain.handle(`${apiPrefix}openWorkspaceFile`, async () => {
  const files = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Workspace Configuration', extensions: ['json'] }],
  });
  if (!files) {
    return null;
  }
  const workspaceConfig = await fs.readFile(files[0], 'utf8');
  return JSON.parse(workspaceConfig);
});
ipcMain.handle(`${apiPrefix}save`, async (event, workspace) => {
  const workspaceJson = JSON.stringify(workspace);
  await fs.writeFile(workspace.location, workspaceJson);
});

ipcMain.handle(`${apiPrefix}load`, async (event, location) => {
  const workspace = await fs.readFile(location, 'utf8');
  return JSON.parse(workspace);
});
