const localStorageKey = 'orchestrator-connections';

export interface IOrchestratorConnection {
  id: string;
  name: string;
  orchestrator: string;
  connectionSettings: unknown;
}

export default {
  getConnectionSettings(): IOrchestratorConnection[] {
    const connections = localStorage.getItem(localStorageKey);
    return connections ? JSON.parse(connections) : [];
  },
  addConnectionSetting(connection: IOrchestratorConnection) {
    const connections = this.getConnectionSettings();
    connections.push(connection);
    this.saveConnectionSettings(connections);
  },
  saveConnectionSettings(connections: IOrchestratorConnection[]) {
    localStorage.setItem(localStorageKey, JSON.stringify(connections));
  },
};
