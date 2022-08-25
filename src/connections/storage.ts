const localStorageKey = 'orchestrator-connections';

export interface IOrchestratorConnectionSettings {
  id: string;
  active: boolean;
  orchestrator: string;
  options: unknown;
}

export default {
  getConnectionSettings(): IOrchestratorConnectionSettings[] {
    const connections = localStorage.getItem(localStorageKey);
    return connections ? JSON.parse(connections) : [];
  },
  saveConnectionSettings(connections: IOrchestratorConnectionSettings[]) {
    localStorage.setItem(localStorageKey, JSON.stringify(connections));
  },
  getActiveConnectionSettings(): IOrchestratorConnectionSettings | undefined {
    const connections = this.getConnectionSettings();
    return connections.find((x) => x.active);
  },
};
