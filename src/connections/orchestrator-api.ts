import {computed, ComputedRef, ref} from 'vue';
import type { Ref } from 'vue';
import KubernetesApi from '@/connections/kubernetes-api';
import connectionsStorage, { IOrchestratorConnectionSettings } from '@/connections/storage';

interface IKubernetesClientApi extends IOrchestratorApi {
  connectToContext(context: string);
}

declare global {
  interface Window {
    k8sApi: IKubernetesClientApi;
  }
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  searchDeployments(query: string): Promise<any>;
}

export interface IOrchestratorApiConnection extends IOrchestratorApi {
  orchestratorName: ComputedRef<string>;
  connect(connectionSettings: IOrchestratorConnectionSettings): void;
  testConnection(connectionSettings: IOrchestratorConnectionSettings): Promise<boolean>;
}

class OrchestratorNotConnectedError extends Error {
  constructor() {
    super('Unable to perform this action because you are not connected to an orchestrator');
  }
}

class OrchestratorNotConnected implements IOrchestratorApi {
  public name = 'No Orchestrator';
  test(): Promise<boolean> {
    return Promise.resolve(false);
  }
  searchDeployments(query: string): Promise<any> {
    throw new OrchestratorNotConnectedError();
  }
}
const api: Ref<IOrchestratorApi> = ref(new OrchestratorNotConnected());

function createOrchestratorApi(
  connectionSettings: IOrchestratorConnectionSettings
): IOrchestratorApi {
  switch (connectionSettings.orchestrator) {
    case 'Kubernetes':
      if (window.k8sApi) {
        window.k8sApi.connectToContext(connectionSettings.options);
        return window.k8sApi;
      }
      return new KubernetesApi(connectionSettings.options);
  }
  return new OrchestratorNotConnected();
}

function connect(connectionSettings: IOrchestratorConnectionSettings): void {
  api.value = createOrchestratorApi(connectionSettings);
}
async function testConnection(
  connectionSettings: IOrchestratorConnectionSettings
): Promise<boolean> {
  const connection = createOrchestratorApi(connectionSettings);
  return await connection.test();
}

const activeConnection = connectionsStorage.getActiveConnectionSettings();
if (activeConnection) {
  connect(activeConnection);
}

export function useOrchestratorApi(): IOrchestratorApiConnection {
  return {
    connect,
    testConnection,
    name: api.value.name,
    orchestratorName: computed(() => api.value.name),
    searchDeployments: (query) => api.value.searchDeployments(query),
    test: () => api.value.test(),
  };
}
