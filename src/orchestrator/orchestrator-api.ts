import { computed, ComputedRef, ref } from 'vue';
import type { Ref } from 'vue';
import { OrchestratorConnection } from '@/connections/storage';
import Slo, {
  DeployedPolarisSloMapping,
  PolarisElasticityStrategySloOutput,
  PolarisSloMapping,
} from '@/workspace/slo/Slo';
import { getOrchestrator } from '@/orchestrator/orchestrators';
import {
  PolarisController,
  PolarisControllerDeploymentMetadata,
  WorkspaceComponent,
} from '@/workspace/PolarisComponent';
import { ApiObject, NamespacedObjectReference, ObjectKind, ObjectKindWatcher } from '@polaris-sloc/core';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { ISubscribable, ISubscribableCallback } from '@/crosscutting/subscibable';
import { v4 as uuidv4 } from 'uuid';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { SloMetricSourceTemplate } from '@/polaris-templates/slo-metrics/metrics-template';

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
  successfulResourcesCount: number;
  failedResources: PolarisResource[];
}
export interface PolarisSloDeploymentResult extends PolarisDeploymentResult {
  deployedSloMapping?: DeployedPolarisSloMapping;
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  findPolarisDeployments(): Promise<IDeployment[]>;
  findDeployments(namespace?: string): Promise<IDeployment[]>;
  applySlo(slo: Slo, target: SloTarget, template: SloTemplateMetadata): Promise<DeployedPolarisSloMapping>;
  deleteSlo(slo: Slo): Promise<void>;
  findSloMapping(slo: Slo): Promise<PolarisSloMapping>;
  findSloMappings(objectKind: ObjectKind): Promise<ApiObjectList<PolarisSloMapping>>;
  findSloCompliances(objectKind: ObjectKind): Promise<ApiObjectList<PolarisElasticityStrategySloOutput>>;
  deploySloMappingCrd(template: SloTemplateMetadata): Promise<boolean>;
  createWatcher(bookmarkManager: WatchBookmarkManager): ObjectKindWatcher;
  createPolarisMapper(): PolarisMapper;
  listTemplateDefinitions(): Promise<ApiObjectList<any>>;
  findPolarisControllers(): Promise<PolarisController[]>;
  deploySloController(slo: Slo, template: SloTemplateMetadata): Promise<PolarisDeploymentResult>;
  deployElasticityStrategyController(
    elasticityStrategy: ElasticityStrategy,
    deploymentMetadata: PolarisControllerDeploymentMetadata
  ): Promise<PolarisDeploymentResult>;
  deployComposedMetricsController(controllerTemplate: SloMetricSourceTemplate): Promise<PolarisDeploymentResult>;
}

export interface IPolarisOrchestratorApi extends IOrchestratorApi {
  crdObjectKind: ObjectKind;
  configure(polarisOptions: unknown): void;
}

export const CONNECTED_EVENT = 'connected';

export interface IOrchestratorApiConnection extends IOrchestratorApi, ISubscribable {
  orchestratorName: ComputedRef<string>;
  crdObjectKind: ComputedRef<ObjectKind>;
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
  public crdObjectKind = new ObjectKind();
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

  applySlo(): Promise<DeployedPolarisSloMapping> {
    throw new OrchestratorNotConnectedError();
  }

  findSloMapping(): Promise<PolarisSloMapping> {
    throw new OrchestratorNotConnectedError();
  }
  findSloMappings(): Promise<ApiObjectList<PolarisSloMapping>> {
    throw new OrchestratorNotConnectedError();
  }
  deploySloMappingCrd(): Promise<boolean> {
    throw new OrchestratorNotConnectedError();
  }

  createWatcher(): ObjectKindWatcher {
    throw new OrchestratorNotConnectedError();
  }

  deleteSlo(): Promise<void> {
    throw new OrchestratorNotConnectedError();
  }

  createPolarisMapper(): PolarisMapper {
    return undefined;
  }

  listTemplateDefinitions(): Promise<ApiObjectList<any>> {
    throw new OrchestratorNotConnectedError();
  }

  findSloCompliances(): Promise<ApiObjectList<PolarisElasticityStrategySloOutput>> {
    throw new OrchestratorNotConnectedError();
  }

  findPolarisControllers(): Promise<PolarisController[]> {
    throw new OrchestratorNotConnectedError();
  }

  deployElasticityStrategyController(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  deploySloController(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  deployComposedMetricsController(): Promise<PolarisDeploymentResult> {
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
  component: WorkspaceComponent,
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

async function deployMetricController(
  template: SloMetricSourceTemplate,
  deploymentAction: () => Promise<PolarisDeploymentResult>
): Promise<PolarisDeploymentResult> {
  runningDeployments.value[template.id] = {
    id: template.id,
    name: `${template.displayName} Metric`,
    dismissed: false,
  };
  const result = await deploymentAction();
  delete runningDeployments[template.id];
  return result;
}

export function useOrchestratorApi(): IOrchestratorApiConnection {
  return {
    connect,
    testConnection,
    name: api.value.name,
    orchestratorName: computed(() => api.value.name),
    crdObjectKind: computed(() => api.value.crdObjectKind),
    findPolarisDeployments: () => api.value.findPolarisDeployments(),
    findDeployments: (namespace?) => api.value.findDeployments(namespace),
    test: () => api.value.test(),
    deleteSlo: (slo) => api.value.deleteSlo(clone(slo)),
    applySlo: (slo, target, template) => api.value.applySlo(clone(slo), clone(target), clone(template)),
    findSloMapping: (slo) => api.value.findSloMapping(clone(slo)),
    findSloMappings: (objectKind) => api.value.findSloMappings(objectKind),
    findSloCompliances: (objectKind) => api.value.findSloCompliances(objectKind),
    deploySloMappingCrd: (template) => api.value.deploySloMappingCrd(clone(template)),
    createWatcher: (bookmarkManager) => api.value.createWatcher(bookmarkManager),
    createPolarisMapper: () => api.value.createPolarisMapper(),
    listTemplateDefinitions: () => api.value.listTemplateDefinitions(),
    findPolarisControllers: () => api.value.findPolarisControllers(),
    deploySloController: (slo, template) =>
      deploy(slo, () => api.value.deploySloController(clone(slo), clone(template))),
    deployElasticityStrategyController: (elasticityStrategy, deploymentMetadata) =>
      deploy(elasticityStrategy, () =>
        api.value.deployElasticityStrategyController(clone(elasticityStrategy), clone(deploymentMetadata))
      ),
    deployComposedMetricsController: (controllerTemplate) =>
      deployMetricController(controllerTemplate, () =>
        api.value.deployComposedMetricsController(clone(controllerTemplate))
      ),
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
