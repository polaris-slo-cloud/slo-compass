import { computed, ComputedRef, ref } from 'vue';
import type { Ref } from 'vue';
import KubernetesApi, { K8sConnectionOptions } from '@/orchestrator/kubernetes/api';
import connectionsStorage, { IOrchestratorConnectionSettings } from '@/connections/storage';
import ISlo from '@/slo/ISlo';

export interface IDeployment {
  id: string;
  name: string;
  status: string;
  connectionMetadata: unknown;
}
export interface IResourceDeploymentStatus {
  resource: unknown;
  success: boolean;
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  findDeployments(query?: string): Promise<IDeployment[]>;
  // TODO: find more specific return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deploySlo(slo: ISlo): Promise<IResourceDeploymentStatus[]>;
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

  findDeployments(): Promise<IDeployment[]> {
    throw new OrchestratorNotConnectedError();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deploySlo(): Promise<any> {
    throw new OrchestratorNotConnectedError();
  }
}
const api: Ref<IOrchestratorApi> = ref(new OrchestratorNotConnected());

function createOrchestratorApi(
  connectionSettings: IOrchestratorConnectionSettings
): IOrchestratorApi {
  switch (connectionSettings.orchestrator) {
    case 'Kubernetes': {
      return new KubernetesApi(connectionSettings.options as K8sConnectionOptions);
    }
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
    findDeployments: (query?) => api.value.findDeployments(query),
    test: () => api.value.test(),
    deploySlo: (slo) => api.value.deploySlo(slo),
  };
}
