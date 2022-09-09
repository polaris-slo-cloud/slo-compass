import { computed, ComputedRef, ref } from 'vue';
import type { Ref } from 'vue';
import { IOrchestratorConnection } from '@/connections/storage';
import Slo from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { getOrchestrator } from '@/orchestrator/orchestrators';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

export interface IDeployment {
  id: string;
  name: string;
  status: string;
  connectionMetadata: unknown;
}
export interface PolarisDeploymentResult {
  failedResources: unknown[];
  deployedControllers: PolarisController[];
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  findDeployments(query?: string): Promise<IDeployment[]>;
  deploySlo(slo: Slo): Promise<PolarisDeploymentResult>;
  deployElasticityStrategy(
    elasticityStrategy: ElasticityStrategy
  ): Promise<PolarisDeploymentResult>;
  retryDeployment(item: PolarisComponent): Promise<PolarisDeploymentResult>;
}

export interface IPolarisOrchestratorApi extends IOrchestratorApi {
  configure(polarisOptions: unknown): void;
}

export interface IOrchestratorApiConnection extends IOrchestratorApi {
  orchestratorName: ComputedRef<string>;
  connect(connection: IOrchestratorConnection, polarisOptions: unknown): void;
  testConnection(connection: IOrchestratorConnection): Promise<boolean>;
}

class OrchestratorNotConnectedError extends Error {
  constructor() {
    super('Unable to perform this action because you are not connected to an orchestrator');
  }
}

class OrchestratorNotConnected implements IPolarisOrchestratorApi {
  public name = 'No Orchestrator';
  test(): Promise<boolean> {
    return Promise.resolve(false);
  }

  configure(): void {
    throw new OrchestratorNotConnectedError();
  }

  findDeployments(): Promise<IDeployment[]> {
    throw new OrchestratorNotConnectedError();
  }

  deploySlo(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  deployElasticityStrategy(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  retryDeployment(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }
}
const api: Ref<IPolarisOrchestratorApi> = ref(new OrchestratorNotConnected());

function createOrchestratorApi(connection: IOrchestratorConnection): IPolarisOrchestratorApi {
  const orchestratorConfig = getOrchestrator(connection.orchestrator);
  return orchestratorConfig
    ? orchestratorConfig.createOrchestratorApi(connection)
    : new OrchestratorNotConnected();
}

function connect(connection: IOrchestratorConnection, polarisOptions: unknown): void {
  api.value = createOrchestratorApi(connection);
  api.value.configure(polarisOptions);
}
async function testConnection(connection: IOrchestratorConnection): Promise<boolean> {
  const apiConnection = createOrchestratorApi(connection);
  return await apiConnection.test();
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
    deployElasticityStrategy: (elasticityStrategy) =>
      api.value.deployElasticityStrategy(elasticityStrategy),
    retryDeployment: (item) => api.value.retryDeployment(item),
  };
}
