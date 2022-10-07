const orchestratorConnectionsLocalStorageKey = 'orchestrator-connections';
const metricsProvidersLocalStorageKey = 'metrics-providers';
const workspaceConnectionsLocalStorageKey = 'workspace-connections';

export interface OrchestratorConnection {
  id: string;
  name: string;
  orchestrator: string;
  connectionSettings: unknown;
}

export const orchestratorStorage = {
  getConnectionSettings(): OrchestratorConnection[] {
    const connections = localStorage.getItem(orchestratorConnectionsLocalStorageKey);
    return connections ? JSON.parse(connections) : [];
  },
  addConnectionSetting(connection: OrchestratorConnection) {
    const connections = this.getConnectionSettings();
    connections.push(connection);
    this.saveConnectionSettings(connections);
  },
  saveConnectionSettings(connections: OrchestratorConnection[]) {
    localStorage.setItem(orchestratorConnectionsLocalStorageKey, JSON.stringify(connections));
  },
};

export interface MetricsConnection {
  id: string;
  name: string;
  metricsProvider: string;
  connectionSettings: unknown;
}

export const metricsProviderStorage = {
  getConnectionSettings(): MetricsConnection[] {
    const connections = localStorage.getItem(metricsProvidersLocalStorageKey);
    return connections ? JSON.parse(connections) : [];
  },
  addConnectionSetting(connection: MetricsConnection) {
    const connections = this.getConnectionSettings();
    connections.push(connection);
    this.saveConnectionSettings(connections);
  },
  saveConnectionSettings(connections: MetricsConnection[]) {
    localStorage.setItem(metricsProvidersLocalStorageKey, JSON.stringify(connections));
  },
};

export interface WorkspaceConnections {
  orchestrator: OrchestratorConnection;
  metrics: MetricsConnection;
}

function getAllConnectionsByWorkspace(): Record<string, WorkspaceConnections> {
  const connections = localStorage.getItem(workspaceConnectionsLocalStorageKey);
  return connections ? JSON.parse(connections) : {};
}

export const workspaceConnectionStorage = {
  getConnectionsForWorkspace(workspaceId: string): WorkspaceConnections {
    const byWorkspace = getAllConnectionsByWorkspace();
    return byWorkspace[workspaceId];
  },
  setConnectionsForWorkspace(workspaceId: string, connections: WorkspaceConnections) {
    const byWorkspace = getAllConnectionsByWorkspace();
    byWorkspace[workspaceId] = connections;
    localStorage.setItem(workspaceConnectionsLocalStorageKey, JSON.stringify(byWorkspace));
  },
};
