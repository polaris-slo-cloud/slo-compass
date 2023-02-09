const { ipcMain, app } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const apiPrefix = 'templates-';

ipcMain.handle(`${apiPrefix}saveTemplates`, async (event, templates) => {
  const appDataDirectory = app.getPath('userData');
  const templatesFile = path.join(appDataDirectory, 'polaris-templates.json');
  const data = JSON.stringify(templates);
  await fs.writeFile(templatesFile, data);
});
ipcMain.handle(`${apiPrefix}loadTemplates`, async () => {
  const appDataDirectory = app.getPath('userData');
  const templatesFile = path.join(appDataDirectory, 'polaris-templates.json');
  try {
    const templates = await fs.readFile(templatesFile, 'utf8');
    return JSON.parse(templates);
  } catch (e) {
    return [];
  }
});
