import {
  ApiObjectList,
  CustomResourceObjectReference,
  IDeployment,
  IPolarisOrchestratorApi,
  PolarisDeploymentResult,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo, {
  DeployedPolarisSloMapping,
  PolarisElasticityStrategySloOutput,
  PolarisSloMapping,
} from '@/workspace/slo/Slo';
import { KubernetesObject, V1Deployment } from '@kubernetes/client-node';
import { PolarisController } from '@/workspace/PolarisComponent';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { ApiObject, NamespacedObjectReference, ObjectKind, ObjectKindWatcher, POLARIS_API } from '@polaris-sloc/core';
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

  async deleteSlo(slo: Slo): Promise<void> {
    if (slo.deployedSloMapping?.reference) {
      const identifier = await this.getCustomResourceIdentifier(slo.deployedSloMapping.reference);
      await this.client.deleteCustomResourceObject(identifier);
    }
  }

  async applySlo(slo: Slo, target: SloTarget, template: SloTemplateMetadata): Promise<DeployedPolarisSloMapping> {
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

  async findPolarisControllers(): Promise<PolarisController[]> {
    const customResourceDefinitions = await this.client.listCustomResourceDefinitions();
    const polarisCrdGroups: string[] = [POLARIS_API.SLO_GROUP, POLARIS_API.ELASTICITY_GROUP, POLARIS_API.METRICS_GROUP];
    const polarisCrds = customResourceDefinitions.items.filter((x) => polarisCrdGroups.includes(x.spec.group));
    const polarisCrdResourceNames = polarisCrds.map((x) => x.spec.names.plural);
    const polarisCrdKindMap = new Map(polarisCrds.map((x) => [x.spec.names.plural, x.spec.names.kind]));

    if (polarisCrds.length === 0) {
      return [];
    }

    const clusterRoles = await this.client.listClusterRoles();
    const matchingPolarisClusterRoles = clusterRoles.items
      .map<[roleName: string, polarisResource: string]>((x) => {
        const matchingRule = x.rules.find(
          (rule) => rule.resources && rule.resources.length === 1 && polarisCrdResourceNames.includes(rule.resources[0])
        );
        return matchingRule ? [x.metadata.name, matchingRule.resources[0]] : null;
      })
      .filter((x) => !!x);
    if (matchingPolarisClusterRoles.length === 0) {
      return [];
    }
    const polarisClusterRoleMap = new Map(matchingPolarisClusterRoles);

    const clusterRoleBindings = await this.client.listClusterRoleBindings();
    const polarisServiceAccounts = clusterRoleBindings.items
      .map((x) => {
        const matchingResource = polarisClusterRoleMap.get(x.roleRef.name);
        return matchingResource
          ? x.subjects
              .filter((s) => s.kind === 'ServiceAccount')
              .map((s) => ({ name: s.name, namespace: s.namespace, resource: matchingResource }))
          : null;
      })
      .flatMap((x) => x)
      .filter((x) => !!x);
    if (polarisServiceAccounts.length === 0) {
      return [];
    }

    const deployments = await this.client.listAllDeployments();
    const polarisControllers = deployments.items
      .map<PolarisController>((x) => {
        const matchingServiceAccount = polarisServiceAccounts.find(
          (s) => s.name === x.spec?.template?.spec?.serviceAccountName && s.namespace === x.metadata.namespace
        );
        return matchingServiceAccount
          ? {
              handlesKind: polarisCrdKindMap.get(matchingServiceAccount.resource),
              type: this.getControllerType(x),
              deployment: {
                name: x.metadata.name,
                namespace: x.metadata.namespace,
                kind: 'Deployment',
                version: 'v1',
                group: 'apps',
              },
            }
          : null;
      })
      .filter((x) => !!x);
    return polarisControllers;
  }

  private getControllerType(
    deployment: V1Deployment
  ): 'SLO Controller' | 'Metrics Controller' | 'Elasticity Strategy Controller' {
    const controllerContrainer = deployment.spec?.template?.spec?.containers[0];

    switch (controllerContrainer?.name) {
      case 'slo-controller':
        return 'SLO Controller';
      case 'elasticity-controller':
        return 'Elasticity Strategy Controller';
      case 'metrics-controller':
        return 'Metrics Controller';
    }
    return null;
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
          (x) => x.deploymentMetadata.name === resource.metadata.name && resource.kind === 'Deployment'
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
