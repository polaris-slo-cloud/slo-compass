import { loadCurrentWorkspace, setupAutosave } from '@/workspace/store-helper';
import { setupBackgroundTasks } from '@/initialization/background';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';
import { workspaceConnectionStorage } from '@/connections/storage';
import { updateWorkspaceFromOrchestrator } from '@/initialization/polaris-workspace-loader';
import { watch } from 'vue';

let stopBackgroundTasks;

function setupConnections() {
  const store = useWorkspaceStore();
  const orchestratorApi = useOrchestratorApi();
  const metricsProvider = useMetricsProvider();

  const connections = workspaceConnectionStorage.getConnectionsForWorkspace(store.workspaceId);
  if (connections?.orchestrator) {
    orchestratorApi.connect(connections.orchestrator, store.polarisOptions);
  }
  if (connections?.metrics) {
    metricsProvider.connect(connections.metrics);
  }
}

async function initializeWorkspace(isOpen) {
  if (isOpen) {
    await updateWorkspaceFromOrchestrator();
    stopBackgroundTasks = await setupBackgroundTasks();
  } else if (stopBackgroundTasks) {
    stopBackgroundTasks();
    stopBackgroundTasks = null;
  }
}

export async function initialize() {
  setupAutosave();
  await loadCurrentWorkspace();
  setupConnections();

  const store = useWorkspaceStore();
  await initializeWorkspace(store.isOpened);
  watch(
    () => store.isOpened,
    async (isOpen, wasOpen) => {
      if (isOpen !== wasOpen) {
        await initializeWorkspace(isOpen);
      }
    }
  );
}
