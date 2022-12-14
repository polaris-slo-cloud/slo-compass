import { useWorkspaceStore } from '@/store/workspace';
import { watch } from 'vue';

function saveWorkspacesInLocalStorage(workspaces) {
  if (workspaces) {
    window.localStorage.setItem('workspaces', JSON.stringify(workspaces));
  }
}

async function saveWorkspace(workspace) {
  if (workspace.location && window.workspaceApi) {
    await window.workspaceApi.save(workspace);
  } else {
    const workspaces = getWorkspacesFromLocalStorage();
    workspaces[workspace.workspaceId] = workspace;
    saveWorkspacesInLocalStorage(workspaces);
  }
}

function getWorkspacesFromLocalStorage() {
  const workspaces = window.localStorage.getItem('workspaces');
  return workspaces ? JSON.parse(workspaces) : {};
}

export async function getWorkspace(id) {
  const workspaceInfo = getRecentWorkspaces().find((x) => x.id === id);
  if (workspaceInfo.location) {
    return window.workspaceApi ? await window.workspaceApi.load(workspaceInfo.location) : null;
  }
  const workspaces = getWorkspacesFromLocalStorage();
  return workspaces[id];
}

export function markWorkspaceAsUsed(workspace) {
  let recents = getRecentWorkspaces().filter((x) => x.id !== workspace.workspaceId);
  recents = [
    {
      id: workspace.workspaceId,
      name: workspace.name,
      date: new Date().toISOString(),
      location: workspace.location,
    },
    ...recents,
  ];
  window.localStorage.setItem('recentWorkspaces', JSON.stringify(recents));
  window.sessionStorage.setItem('currentWorkspace', workspace.workspaceId);
}

export function getRecentWorkspaces() {
  const recents = window.localStorage.getItem('recentWorkspaces');
  return recents ? JSON.parse(recents) : [];
}

async function saveWorkspaceState(state, store) {
  if (state.workspaceId) {
    const workspace = JSON.parse(
      JSON.stringify({
        ...state,
        slos: store.slos,
        targets: store.targets,
        elasticityStrategies: store.elasticityStrategies,
        polarisControllers: store.polarisControllers,
      })
    );
    delete workspace.isOpened;
    await saveWorkspace(workspace);
  }
}

export function setupAutosave() {
  const store = useWorkspaceStore();
  store.$subscribe(async (mutation, state) => {
    await saveWorkspaceState(state, store);
  });
  watch(
    () => store.slos,
    () => saveWorkspaceState(store.$state, store),
    { deep: true }
  );
  watch(
    () => store.targets,
    () => saveWorkspaceState(store.$state, store),
    { deep: true }
  );
  watch(
    () => store.elasticityStrategies,
    () => saveWorkspaceState(store.$state, store),
    { deep: true }
  );
  watch(
    () => store.polarisControllers,
    () => saveWorkspaceState(store.$state, store),
    { deep: true }
  );
}

export async function loadCurrentWorkspace() {
  const store = useWorkspaceStore();
  const currentWorkspaceId = window.sessionStorage.getItem('currentWorkspace');
  if (currentWorkspaceId) {
    const workspace = await getWorkspace(currentWorkspaceId);
    await store.loadWorkspace(workspace);
    markWorkspaceAsUsed(workspace);
    return workspace;
  }
}
