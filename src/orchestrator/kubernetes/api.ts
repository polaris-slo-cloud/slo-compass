import {
  IDeployment,
  IPolarisOrchestratorApi,
  PolarisDeploymentResult,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { KubernetesObject } from '@kubernetes/client-node';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

export interface K8sConnectionOptions {
  connectionString: string;
  polarisNamespace: string;
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

  async deploySlo(slo: Slo): Promise<PolarisDeploymentResult> {
    const resources = await resourceGenerator.generateSloResources(
      slo,
      this.connectionOptions.polarisNamespace
    );

    return await this.deployResources(resources, slo.polarisControllers);
  }

  async deployElasticityStrategy(
    elasticityStrategy: ElasticityStrategy
  ): Promise<PolarisDeploymentResult> {
    const resources = await resourceGenerator.generateElasticityStrategyResources(
      elasticityStrategy,
      this.connectionOptions.polarisNamespace
    );

    return await this.deployResources(resources, elasticityStrategy.polarisControllers);
  }

  async retryDeployment(item: PolarisComponent): Promise<PolarisDeploymentResult> {
    if (item.failedDeployments && item.failedDeployments.length > 0) {
      return await this.deployResources(item.failedDeployments, item.polarisControllers);
    }
    return {
      failedResources: [],
      deployedControllers: [],
    };
  }

  private async deployResources(
    resources: KubernetesObject[],
    polarisControllers: PolarisController[]
  ): Promise<PolarisDeploymentResult> {
    const failedResources = [];
    const deployedControllers = [];
    for (const resource of resources) {
      const deploymentStatusResource = {
        ...resource,
        displayName: `${resource.metadata.name} (${resource.apiVersion}/${resource.kind})`,
      };
      try {
        const existing = await this.client.read(resource);
        if (existing === null) {
          await this.client.create(resource);
        } else {
          await this.client.patch(resource);
        }
        const controller = polarisControllers.find(
          (x) => x.name === resource.metadata.name && resource.kind === 'Deployment'
        );
        if (controller) {
          deployedControllers.push({
            ...controller,
            deployment: {
              kind: resource.kind,
              apiVersion: resource.apiVersion,
              name: resource.metadata.name,
              namespace: resource.metadata.namespace,
            },
          });
        }
      } catch (e) {
        failedResources.push(deploymentStatusResource);
      }
    }
    return {
      failedResources,
      deployedControllers,
    };
  }
}
