import { loadCurrentWorkspace, setupAutosave } from '@/workspace/store-helper';
import { setupBackgroundTasks } from '@/background';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';
import { workspaceConnectionStorage } from '@/connections/storage';

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

export async function initialize() {
  setupAutosave();
  await loadCurrentWorkspace();
  setupConnections();
  setupBackgroundTasks();
}
