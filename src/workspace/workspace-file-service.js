const browserWorkspaceFileService = {
  async openWorkspaceFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.click();
    const promise = new Promise((resolve, reject) => {
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) {
          reject();
        } else {
          resolve(file);
        }
      });
    });
    const file = await promise;
    return JSON.parse(await file.text());
  },
};

const service = window.workspaceApi
  ? window.workspaceApi
  : browserWorkspaceFileService;

export default service;
