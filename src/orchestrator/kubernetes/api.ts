import {
  CustomResourceObjectReference,
  IDeployment,
  IPolarisOrchestratorApi,
  PolarisDeploymentResult,
  PolarisSloDeploymentResult,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo, { PolarisSloMapping } from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { KubernetesObject, V1CustomResourceDefinition } from '@kubernetes/client-node';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';
import { getTemplate as getSloTemplate } from '@/polaris-templates/slo-template';
import {SloTarget} from "@/workspace/targets/SloTarget";

export interface K8sConnectionOptions {
  connectionString: string;
  polarisNamespace: string;
}

interface KubernetesDeploymentResult {
  successful: KubernetesObject[];
  failed: KubernetesObject[];
}

export default class Api implements IPolarisOrchestratorApi {
  public name = 'Kubernetes';
  private client: K8sClient;
  private connectionOptions: K8sConnectionOptions;

  constructor(connectionSettings: string) {
    this.client = createClient(connectionSettings);
    this.connectionOptions = { connectionString: connectionSettings, polarisNamespace: 'default' };
  }

  configure(polarisOptions: string) {
    this.connectionOptions.polarisNamespace = polarisOptions;
  }

  async findDeployments(query?: string): Promise<IDeployment[]> {
    try {
      const data = await this.client.listAllDeployments();
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
      if (query) {
        const lowerQuery = query.toLowerCase();
        return items.filter((x) => x.name.toLowerCase().includes(lowerQuery));
      }
      return items;
    } catch (e) {
      return [];
    }
  }

  test = async (): Promise<boolean> => await this.client.test();

  async deploySlo(slo: Slo, target: SloTarget): Promise<PolarisSloDeploymentResult> {
    const template = getSloTemplate(slo.template);
    const resources = await resourceGenerator.generateSloResources(
      slo,
      target,
      this.connectionOptions.polarisNamespace,
      template
    );

    const result = await this.deployControllerResources(
      resources.staticResources,
      slo.polarisControllers
    );
    const sloMappingSuccessful = await this.deployResource(resources.sloMapping);
    const mappingCrd = resources.staticResources.find(
      (x) =>
        x.kind === 'CustomResourceDefinition' &&
        (x as V1CustomResourceDefinition).spec.names.kind === template.sloMappingKind
    ) as V1CustomResourceDefinition;

    return {
      deployedControllers: result.deployedControllers,
      failedResources: result.failedResources,
      deployedSloMapping: sloMappingSuccessful
        ? {
            group: mappingCrd.spec.group,
            version: mappingCrd.spec.versions[0].name,
            kind: resources.sloMapping.kind,
            plural: mappingCrd.spec.names.plural,
            name: resources.sloMapping.metadata.name,
            namespace: resources.sloMapping.metadata.namespace,
          }
        : null,
    };
  }

  async deployElasticityStrategy(
    elasticityStrategy: ElasticityStrategy
  ): Promise<PolarisDeploymentResult> {
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

  async applySloMapping(slo: Slo, target: SloTarget): Promise<CustomResourceObjectReference> {
    const mapping = resourceGenerator.generateSloMapping(slo, target);
    const mappingToDelete = slo.sloMapping && slo.sloMapping.name !== mapping.metadata.name;
    const mappingMetadata = await this.client.findCustomResourceMetadata(mapping);
    [mappingMetadata.group, mappingMetadata.version] = mapping.apiVersion.split('/');

    const successfulDeployment = await this.deployResource(mapping);
    if (mappingToDelete) {
      try {
        await this.client.deleteCustomResourceObject(slo.sloMapping);
      } catch (e) {
        console.error(e);
        // TODO: How should we handle this case? In the worst case this mapping will get synced again later on when the UI loads the active Polaris config (In this case the user could manually try to delete it)
      }
    }
    return successfulDeployment
      ? {
          group: mappingMetadata.group,
          version: mappingMetadata.version,
          kind: mapping.kind,
          plural: mappingMetadata.name,
          name: mapping.metadata.name,
          namespace: mapping.metadata.namespace,
        }
      : null;
  }

  async findSloMapping(slo: Slo): Promise<PolarisSloMapping> {
    if (!slo.sloMapping) {
      throw new Error('There is no mapping deployed for this SLO');
    }

    const crdObject = await this.client.getCustomResourceObject(slo.sloMapping);
    return {
      config: crdObject.spec.sloConfig,
      elasticityStrategy: crdObject.spec.elasticityStrategy?.kind,
      elasticityStrategyConfig: crdObject.spec.staticElasticityStrategyConfig || {},
      target: {
        ...crdObject.spec.targetRef,
        namespace: crdObject.metadata.namespace,
      },
    };
  }

  private async deployResources(
    resources: KubernetesObject[]
  ): Promise<KubernetesDeploymentResult> {
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
