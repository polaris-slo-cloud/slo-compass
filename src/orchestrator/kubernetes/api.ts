import {
  ApiObjectList,
  CustomResourceObjectReference,
  IDeployment,
  IPolarisOrchestratorApi,
  PolarisDeploymentResult,
  PolarisSloDeploymentResult,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo, {
  DeployedPolarisSloMapping,
  PolarisElasticityStrategySloOutput,
  PolarisSloMapping,
} from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { KubernetesObject, V1CustomResourceDefinition } from '@kubernetes/client-node';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';
import { SloTarget } from '@/workspace/targets/SloTarget';
import {
  ApiObject,
  NamespacedObjectReference,
  ObjectKind,
  ObjectKindWatcher,
  POLARIS_API,
} from '@polaris-sloc/core';
import { KubernetesObjectKindWatcher } from '@/orchestrator/kubernetes/kubernetes-watcher';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { KubernetesPolarisMapper } from '@/orchestrator/kubernetes/kubernetes-polaris-mapper';
import { transformK8sOwnerReference } from '@/orchestrator/kubernetes/helpers';

export interface K8sConnectionOptions {
  connectionString: string;
  polarisNamespace: string;
}

interface KubernetesDeploymentResult {
  successful: KubernetesObject[];
  failed: KubernetesObject[];
}

interface CustomResourceMetadata {
  kind: ObjectKind;
  plural: string;
}

export default class Api implements IPolarisOrchestratorApi {
  public name = 'Kubernetes';
  public crdObjectKind: ObjectKind = {
    kind: 'CustomResourceDefinition',
    group: 'apiextensions.k8s.io',
    version: 'v1',
  };
  private readonly client: K8sClient;
  private readonly polarisMapper: PolarisMapper;
  private connectionOptions: K8sConnectionOptions;
  private customResourceMetadata: Record<string, Record<string, CustomResourceMetadata>> = {};

  constructor(connectionSettings: string) {
    this.client = createClient(connectionSettings);
    this.connectionOptions = { connectionString: connectionSettings, polarisNamespace: 'default' };
    this.polarisMapper = this.createPolarisMapper();
  }

  configure(polarisOptions: string) {
    this.connectionOptions.polarisNamespace = polarisOptions;
  }

  public createWatcher(bookmarkManager: WatchBookmarkManager): ObjectKindWatcher {
    return new KubernetesObjectKindWatcher(this.client, bookmarkManager);
  }

  public createPolarisMapper(): PolarisMapper {
    return new KubernetesPolarisMapper();
  }

  async findPolarisDeployments(): Promise<IDeployment[]> {
    return await this.findDeployments(this.connectionOptions.polarisNamespace);
  }

  async findDeployments(namespace?: string): Promise<IDeployment[]> {
    try {
      const data = namespace
        ? await this.client.listNamespacedDeployments(namespace)
        : await this.client.listAllDeployments();
      const items = data.items.map((x) => ({
        id: x.metadata.uid,
        name: x.metadata.name,
        status: x.status.conditions[x.status.conditions.length - 1].type,
        connectionMetadata: {
          kind: 'Deployment',
          // Remove group from apiVersion
          version: data.apiVersion.replace('apps/', ''),
          group: 'apps',
          name: x.metadata.name,
          namespace: x.metadata.namespace,
        },
      }));
      return items;
    } catch (e) {
      return [];
    }
  }

  test = async (): Promise<boolean> => await this.client.test();

  async deploySlo(slo: Slo, target: SloTarget, template: SloTemplateMetadata): Promise<PolarisSloDeploymentResult> {
    const resources = await resourceGenerator.generateSloResources(
      slo,
      target,
      this.connectionOptions.polarisNamespace,
      template
    );

    const result = await this.deployControllerResources(resources.staticResources, slo.polarisControllers);
    const sloMappingSuccessful = await this.deployResource(resources.sloMapping);
    const mappingCrd = resources.staticResources.find(
      (x) =>
        x.kind === 'CustomResourceDefinition' &&
        (x as V1CustomResourceDefinition).spec.names.kind === resources.sloMapping.kind
    ) as V1CustomResourceDefinition;

    this.cacheCustomResourceMetadata({
      kind: {
        group: mappingCrd.spec.group,
        version: mappingCrd.spec.versions[0].name,
        kind: resources.sloMapping.kind,
      },
      plural: mappingCrd.spec.names.plural,
    });

    return {
      deployedControllers: result.deployedControllers,
      failedResources: result.failedResources,
      deployedSloMapping: sloMappingSuccessful
        ? {
            reference: {
              group: mappingCrd.spec.group,
              version: mappingCrd.spec.versions[0].name,
              kind: resources.sloMapping.kind,
              name: resources.sloMapping.metadata.name,
              namespace: resources.sloMapping.metadata.namespace,
            },
            sloMapping: this.polarisMapper.transformToPolarisSloMapping(
              resources.sloMapping.spec,
              resources.sloMapping.metadata.namespace
            ),
          }
        : null,
    };
  }

  async deleteSlo(slo: Slo): Promise<void> {
    if (slo.deployedSloMapping?.reference) {
      const identifier = await this.getCustomResourceIdentifier(slo.deployedSloMapping.reference);
      await this.client.deleteCustomResourceObject(identifier);
    }
  }

  async deployElasticityStrategy(elasticityStrategy: ElasticityStrategy): Promise<PolarisDeploymentResult> {
    const resources = await resourceGenerator.generateElasticityStrategyResources(
      elasticityStrategy,
      this.connectionOptions.polarisNamespace
    );

    return await this.deployControllerResources(resources, elasticityStrategy.polarisControllers);
  }

  async retryDeployment(item: PolarisComponent): Promise<PolarisDeploymentResult> {
    if (item.failedDeployments && item.failedDeployments.length > 0) {
      return await this.deployControllerResources(item.failedDeployments, item.polarisControllers);
    }
    return {
      failedResources: [],
      deployedControllers: [],
    };
  }

  async applySloMapping(
    slo: Slo,
    target: SloTarget,
    template: SloTemplateMetadata
  ): Promise<DeployedPolarisSloMapping> {
    const mapping = resourceGenerator.generateSloMapping(slo, target, template.sloMappingKind);
    if (slo.deployedSloMapping?.reference) {
      mapping.metadata.name = slo.deployedSloMapping.reference.name;
      if (
        mapping.metadata.namespace !== slo.deployedSloMapping.reference.namespace ||
        // Kubernetes keeps elasticity strategy config properties if the config schema has changed. Therefore, we delete the old mapping if the elasticity strategy kind changes
        mapping.spec.elasticityStrategy.kind !== slo.deployedSloMapping.sloMapping.elasticityStrategy.kind
      ) {
        try {
          const identifier = await this.getCustomResourceIdentifier(slo.deployedSloMapping.reference);
          await this.client.deleteCustomResourceObject(identifier);
        } catch (e) {
          console.error(e);
          // TODO: How should we handle this case? In the worst case this mapping will get synced again later on when the UI loads the active Polaris config (In this case the user could manually try to delete it)
        }
      }
    }

    const [group, version] = mapping.apiVersion.split('/');
    const successfulDeployment = await this.deployResource(mapping);
    return successfulDeployment
      ? {
          sloMapping: this.polarisMapper.transformToPolarisSloMapping(mapping.spec, mapping.metadata.namespace),
          reference: {
            group,
            version,
            kind: mapping.kind,
            name: mapping.metadata.name,
            namespace: mapping.metadata.namespace,
          },
        }
      : null;
  }

  async findSloMapping(slo: Slo): Promise<PolarisSloMapping> {
    if (!slo.deployedSloMapping?.reference) {
      throw new Error('There is no mapping deployed for this SLO');
    }

    const identifier = await this.getCustomResourceIdentifier(slo.deployedSloMapping.reference);
    const crdObject = await this.client.getCustomResourceObject(identifier);
    return this.polarisMapper.transformToPolarisSloMapping(crdObject.spec, crdObject.metadata.namespace);
  }

  async findSloMappings(objectKind: ObjectKind): Promise<ApiObjectList<PolarisSloMapping>> {
    const metadata = await this.findCustomResourceMetadata(
      `${objectKind.group}/${objectKind.version}`,
      objectKind.kind
    );
    const mappingsList = await this.client.listCustomResourceObjects(objectKind, metadata.plural);
    return {
      metadata: {
        resourceVersion: mappingsList.metadata.resourceVersion,
        ...mappingsList.metadata,
      },
      apiVersion: mappingsList.apiVersion,
      kind: mappingsList.kind,
      items: mappingsList.items.map<ApiObject<PolarisSloMapping>>((obj) => {
        const [group, version] = obj.apiVersion.split('/');
        return {
          ...obj,
          objectKind: {
            kind: obj.kind,
            group,
            version,
          },
          spec: this.polarisMapper.transformToPolarisSloMapping(obj.spec, obj.metadata.namespace),
        };
      }),
    };
  }

  async findSloCompliances(objectKind: ObjectKind): Promise<ApiObjectList<PolarisElasticityStrategySloOutput>> {
    const metadata = await this.findCustomResourceMetadata(
      `${objectKind.group}/${objectKind.version}`,
      objectKind.kind
    );
    const mappingsList = await this.client.listCustomResourceObjects(objectKind, metadata.plural);
    return {
      metadata: {
        resourceVersion: mappingsList.metadata.resourceVersion,
        ...mappingsList.metadata,
      },
      apiVersion: mappingsList.apiVersion,
      kind: mappingsList.kind,
      items: mappingsList.items.map<ApiObject<PolarisElasticityStrategySloOutput>>((obj) => {
        const [group, version] = obj.apiVersion.split('/');
        return {
          ...obj,
          objectKind: {
            kind: obj.kind,
            group,
            version,
          },
          metadata: {
            ...obj.metadata,
            ownerReferences: obj.metadata.ownerReferences.map(transformK8sOwnerReference),
          },
          spec: this.polarisMapper.transformToPolarisElasticityStrategySloOutput(obj.spec, obj.metadata.namespace),
        };
      }),
    };
  }

  async listTemplateDefinitions(): Promise<ApiObjectList<any>> {
    const customResourceDefinitions = await this.client.listCustomResourceDefinitions();
    const polarisTemplateGroups: string[] = [POLARIS_API.SLO_GROUP, POLARIS_API.ELASTICITY_GROUP];
    const templateItems = customResourceDefinitions.items.filter((x) => polarisTemplateGroups.includes(x.spec.group));
    const [group, version] = customResourceDefinitions.apiVersion.split('/');
    return {
      metadata: {
        resourceVersion: customResourceDefinitions.metadata.resourceVersion,
      },
      kind: customResourceDefinitions.kind,
      apiVersion: customResourceDefinitions.apiVersion,
      items: templateItems.map<ApiObject<any>>((obj: any) => {
        return {
          ...obj,
          objectKind: {
            kind: 'CustomResourceDefinition',
            group,
            version,
          },
        };
      }),
    };
  }

  async deploySloMappingCrd(template: SloTemplateMetadata): Promise<boolean> {
    const crd = resourceGenerator.generateCrdFromSloTemplate(template);
    return await this.deployResource(crd);
  }

  private async findCustomResourceMetadata(apiVersion: string, kind: string): Promise<CustomResourceMetadata> {
    const existing = this.customResourceMetadata[kind] ? this.customResourceMetadata[kind][apiVersion] : null;

    if (existing) {
      return existing;
    }

    const result = await this.client.findCustomResourceMetadata(apiVersion, kind);
    const [group, version] = apiVersion.split('/');
    return this.cacheCustomResourceMetadata({
      kind: {
        group,
        version,
        kind,
      },
      plural: result.name,
    });
  }

  private async getCustomResourceIdentifier(
    reference: NamespacedObjectReference
  ): Promise<CustomResourceObjectReference> {
    const metadata = await this.findCustomResourceMetadata(`${reference.group}/${reference.version}`, reference.kind);
    return {
      ...reference,
      plural: metadata.plural,
    };
  }

  private cacheCustomResourceMetadata(metadata: CustomResourceMetadata): CustomResourceMetadata {
    const existingResourceMetadata = this.customResourceMetadata[metadata.kind.kind];
    const apiVersion = `${metadata.kind.group}/${metadata.kind.version}`;
    if (!existingResourceMetadata) {
      this.customResourceMetadata[metadata.kind.kind] = {};
    }
    this.customResourceMetadata[metadata.kind.kind][apiVersion] = metadata;
    return metadata;
  }

  private async deployResources(resources: KubernetesObject[]): Promise<KubernetesDeploymentResult> {
    const result: KubernetesDeploymentResult = {
      successful: [],
      failed: [],
    };
    for (const resource of resources) {
      const success = await this.deployResource(resource);
      if (success) {
        result.successful.push(resource);
      } else {
        result.failed.push(resource);
      }
    }
    return result;
  }

  private async deployResource(resource: KubernetesObject): Promise<boolean> {
    try {
      const existing = await this.client.read(resource);
      if (existing === null) {
        await this.client.create(resource);
      } else {
        await this.client.patch(resource);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private async deployControllerResources(
    resources: KubernetesObject[],
    polarisControllers: PolarisController[]
  ): Promise<PolarisDeploymentResult> {
    const deploymentResult = await this.deployResources(resources);
    const failedResources = deploymentResult.failed.map((resource) => ({
      ...resource,
      displayName: `${resource.metadata.name} (${resource.apiVersion}/${resource.kind})`,
    }));
    const deployedControllers = deploymentResult.successful
      .map((resource): PolarisController => {
        const controller = polarisControllers.find(
          (x) => x.name === resource.metadata.name && resource.kind === 'Deployment'
        );
        if (controller) {
          const [group, version] = resource.apiVersion.split('/');
          return {
            ...controller,
            deployment: {
              kind: resource.kind,
              version,
              group,
              name: resource.metadata.name,
              namespace: resource.metadata.namespace,
            },
          };
        }
        return null;
      })
      .filter((x) => !!x);
    return {
      failedResources,
      deployedControllers,
    };
  }
}
