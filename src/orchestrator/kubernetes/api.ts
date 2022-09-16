import {
  IDeployment,
  IPolarisOrchestratorApi,
  PolarisDeploymentResult,
  PolarisSloDeploymentResult,
  PolarisSloMappingDeploymentResult,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo, { PolarisSloMapping, SloTarget } from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { KubernetesObject, V1CustomResourceDefinition } from '@kubernetes/client-node';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';
import { getTemplate as getSloTemplate } from '@/polaris-templates/slo-template';

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
          apiVersion: data.apiVersion,
          //TODO: Where do i get the group from?
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

  async deploySlo(slo: Slo, targets: SloTarget[]): Promise<PolarisSloDeploymentResult> {
    const template = getSloTemplate(slo.template);
    const resources = await resourceGenerator.generateSloResources(
      slo,
      targets,
      this.connectionOptions.polarisNamespace,
      template
    );

    const result = await this.deployControllerResources(
      resources.staticResources,
      slo.polarisControllers
    );
    const mappingResult = await this.deployResources(resources.sloMappings);
    const mappingCrd = resources.staticResources.find(
      (x) =>
        x.kind === 'CustomResourceDefinition' &&
        (x as V1CustomResourceDefinition).spec.names.kind === template.sloMappingKind
    ) as V1CustomResourceDefinition;

    return {
      deployedControllers: result.deployedControllers,
      failedResources: result.failedResources,
      failedSloMappings: mappingResult.failed,
      deployedSloMappings: mappingResult.successful.map((x) => ({
        group: mappingCrd.spec.group,
        version: mappingCrd.spec.versions[0].name,
        plural: mappingCrd.spec.names.plural,
        name: x.metadata.name,
        namespace: x.metadata.namespace,
      })),
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

  async applySloMapping(
    slo: Slo,
    targets: SloTarget[]
  ): Promise<PolarisSloMappingDeploymentResult> {
    const mappings = resourceGenerator.generateSloMappings(
      slo,
      targets,
      this.connectionOptions.polarisNamespace
    );
    const mappingNames = mappings.map((x) => x.metadata.name);
    const deletedMappings = slo.sloMappings.filter((x) => !mappingNames.includes(x.name));
    const mappingMetadata = await this.client.findCustomResourceMetadata(mappings[0]);

    const result = await this.deployResources(mappings);
    for (const deleted of deletedMappings) {
      try {
        await this.client.deleteCustomResourceObject(deleted);
      } catch (e) {
        result.failed.push(deleted);
      }
    }
    return {
      failedSloMappings: result.failed,
      deployedSloMappings: result.successful.map((x) => ({
        group: mappingMetadata.group,
        version: mappingMetadata.version,
        plural: mappingMetadata.name,
        name: x.metadata.name,
        namespace: x.metadata.namespace,
      })),
    };
  }

  async findSloMappings(slo: Slo): Promise<PolarisSloMapping[]> {
    if (slo.sloMappings.length === 0) {
      throw new Error('There are no mappings deployed for this SLO');
    }

    const result: PolarisSloMapping[] = [];
    for (const mapping of slo.sloMappings) {
      const crdObject = await this.client.getCustomResourceObject(mapping);
      result.push({
        config: crdObject.spec.sloConfig,
        elasticityStrategy: crdObject.spec.elasticityStrategy,
        elasticityStrategyConfig: crdObject.spec.elasticityStrategyConfig,
        target: crdObject.spec.targetRef,
      });
    }

    return result;
  }

  private async deployResources(
    resources: KubernetesObject[]
  ): Promise<KubernetesDeploymentResult> {
    const result: KubernetesDeploymentResult = {
      successful: [],
      failed: [],
    };
    for (const resource of resources) {
      try {
        const existing = await this.client.read(resource);
        if (existing === null) {
          await this.client.create(resource);
        } else {
          await this.client.patch(resource);
        }
        result.successful.push(resource);
      } catch (e) {
        result.failed.push(resource);
      }
    }
    return result;
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
          return {
            ...controller,
            deployment: {
              kind: resource.kind,
              apiVersion: resource.apiVersion,
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
