import { computed, ComputedRef, ref } from 'vue';
import type { Ref } from 'vue';
import { OrchestratorConnection } from '@/connections/storage';
import Slo, {DeployedPolarisSloMapping, PolarisSloMapping} from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { getOrchestrator } from '@/orchestrator/orchestrators';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';
import { ApiObject, NamespacedObjectReference, ObjectKind, ObjectKindWatcher } from '@polaris-sloc/core';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { ISubscribable, ISubscribableCallback } from '@/crosscutting/subscibable';
import { v4 as uuidv4 } from 'uuid';

export interface PolarisResource {
  [key: string]: any;
}
export interface CustomResourceObjectReference extends NamespacedObjectReference {
  plural: string;
}

export interface ApiObjectListMetadata {
  resourceVersion: string;
  [key: string]: any;
}

export interface ApiObjectList<T> {
  apiVersion: string;
  items: ApiObject<T>[];
  kind: string;
  metadata: ApiObjectListMetadata;
}

export interface IDeployment {
  id: string;
  name: string;
  status: string;
  connectionMetadata: NamespacedObjectReference;
}
export interface PolarisDeploymentResult {
  failedResources: PolarisResource[];
  deployedControllers: PolarisController[];
}
export interface PolarisSloDeploymentResult extends PolarisDeploymentResult {
  deployedSloMapping?: DeployedPolarisSloMapping;
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  findPolarisDeployments(): Promise<IDeployment[]>;
  findDeployments(namespace?: string): Promise<IDeployment[]>;
  deploySlo(slo: Slo, target: SloTarget): Promise<PolarisSloDeploymentResult>;
  deleteSlo(slo: Slo): Promise<void>;
  deployElasticityStrategy(elasticityStrategy: ElasticityStrategy): Promise<PolarisDeploymentResult>;
  retryDeployment(item: PolarisComponent): Promise<PolarisDeploymentResult>;
  applySloMapping(slo: Slo, target: SloTarget): Promise<DeployedPolarisSloMapping>;
  findSloMapping(slo: Slo): Promise<PolarisSloMapping>;
  findSloMappings(objectKind: ObjectKind): Promise<ApiObjectList<PolarisSloMapping>>;
  createWatcher(bookmarkManager: WatchBookmarkManager): ObjectKindWatcher;
}

export interface IPolarisOrchestratorApi extends IOrchestratorApi {
  configure(polarisOptions: unknown): void;
}

export const CONNECTED_EVENT = 'connected';

export interface IOrchestratorApiConnection extends IOrchestratorApi, ISubscribable {
  orchestratorName: ComputedRef<string>;
  connect(connection: OrchestratorConnection, polarisOptions: unknown): void;
  testConnection(connection: OrchestratorConnection): Promise<boolean>;
  hasRunningDeployment: ComputedRef<(componentId: string) => boolean>;
  undismissiedRunningDeployments: ComputedRef;
  dismissRunningDeploymentActions(): void;
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

  findPolarisDeployments(): Promise<IDeployment[]> {
    throw new OrchestratorNotConnectedError();
  }

  findDeployments(): Promise<IDeployment[]> {
    throw new OrchestratorNotConnectedError();
  }

  deploySlo(): Promise<PolarisSloDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  deployElasticityStrategy(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  retryDeployment(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  applySloMapping(): Promise<DeployedPolarisSloMapping> {
    throw new OrchestratorNotConnectedError();
  }

  findSloMapping(): Promise<PolarisSloMapping> {
    throw new OrchestratorNotConnectedError();
  }
  findSloMappings(): Promise<ApiObjectList<PolarisSloMapping>> {
    throw new OrchestratorNotConnectedError();
  }

  createWatcher(): ObjectKindWatcher {
    throw new OrchestratorNotConnectedError();
  }

  deleteSlo(): Promise<void> {
    throw new OrchestratorNotConnectedError();
  }
}
const api: Ref<IPolarisOrchestratorApi> = ref(new OrchestratorNotConnected());
const subscribers: Ref<Map<string, Map<string, ISubscribableCallback>>> = ref(new Map());
const runningDeployments = ref({});
const hasRunningDeployment = computed(() => (componentId: string) => !!runningDeployments.value[componentId]);

function createOrchestratorApi(connection: OrchestratorConnection): IPolarisOrchestratorApi {
  const orchestratorConfig = getOrchestrator(connection.orchestrator);
  return orchestratorConfig ? orchestratorConfig.createOrchestratorApi(connection) : new OrchestratorNotConnected();
}

function connect(connection: OrchestratorConnection, polarisOptions: unknown): void {
  api.value = createOrchestratorApi(connection);
  api.value.configure(polarisOptions);
  runningDeployments.value = {};
  const connectedSubscribers = subscribers.value.get(CONNECTED_EVENT);
  if (connectedSubscribers) {
    connectedSubscribers.forEach((callback) => {
      callback();
    });
  }
}
async function testConnection(connection: OrchestratorConnection): Promise<boolean> {
  const apiConnection = createOrchestratorApi(connection);
  return await apiConnection.test();
}

// This is necessary to unwrap VUE 3 Proxy references because the electron bridge can not serialize them
function clone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

async function deploy(
  component: PolarisComponent,
  deploymentAction: () => Promise<PolarisDeploymentResult>
): Promise<PolarisDeploymentResult> {
  runningDeployments.value[component.id] = {
    id: component.id,
    name: component.name,
    dismissed: false,
  };
  const result = await deploymentAction();
  delete runningDeployments.value[component.id];
  return result;
}

export function useOrchestratorApi(): IOrchestratorApiConnection {
  return {
    connect,
    testConnection,
    name: api.value.name,
    orchestratorName: computed(() => api.value.name),
    findPolarisDeployments: () => api.value.findPolarisDeployments(),
    findDeployments: (namespace?) => api.value.findDeployments(namespace),
    test: () => api.value.test(),
    deploySlo: (slo, target) => deploy(slo, () => api.value.deploySlo(clone(slo), clone(target))),
    deleteSlo: (slo) => api.value.deleteSlo(clone(slo)),
    deployElasticityStrategy: (elasticityStrategy) =>
      deploy(elasticityStrategy, () => api.value.deployElasticityStrategy(clone(elasticityStrategy))),
    retryDeployment: (item) => deploy(item, () => api.value.retryDeployment(clone(item))),
    applySloMapping: (slo, target) => api.value.applySloMapping(clone(slo), clone(target)),
    findSloMapping: (slo) => api.value.findSloMapping(clone(slo)),
    findSloMappings: (objectKind) => api.value.findSloMappings(objectKind),
    createWatcher: (bookmarkManager) => api.value.createWatcher(bookmarkManager),
    hasRunningDeployment,
    undismissiedRunningDeployments: computed(() =>
      Object.values(runningDeployments.value).filter((x: any) => !x.dismissed)
    ),
    dismissRunningDeploymentActions() {
      Object.values(runningDeployments.value).forEach((x: any) => (x.dismissed = true));
    },
    on(event: string, callback: ISubscribableCallback) {
      const subscriberId = uuidv4();
      if (subscribers.value.has(event)) {
        subscribers.value.get(event).set(subscriberId, callback);
      } else {
        subscribers.value.set(event, new Map([[subscriberId, callback]]));
      }

      return () => subscribers.value.get(event).delete(subscriberId);
    },
  };
}
