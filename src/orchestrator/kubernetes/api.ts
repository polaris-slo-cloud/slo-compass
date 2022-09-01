import {
  IDeployment,
  IOrchestratorApi,
  IResourceDeploymentStatus,
} from '@/orchestrator/orchestrator-api';
import createClient, { K8sClient } from '@/orchestrator/kubernetes/client';
import resourceGenerator from '@/orchestrator/kubernetes/resource-generator';
import Slo from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { KubernetesObject } from '@kubernetes/client-node';

export interface K8sConnectionOptions {
  connectionString: string;
  polarisNamespace: string;
}

export default class Api implements IOrchestratorApi {
  public name = 'Kubernetes';
  private client: K8sClient;
  private connectionOptions: K8sConnectionOptions;

  constructor(options: K8sConnectionOptions) {
    this.client = createClient(options.connectionString);
    this.connectionOptions = options;
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

  async deploySlo(slo: Slo): Promise<IResourceDeploymentStatus[]> {
    const resources = await resourceGenerator.generateSloResources(
      slo,
      this.connectionOptions.polarisNamespace
    );

    return await this.deployResources(resources);
  }

  async deployElasticityStrategy(
    elasticityStrategy: ElasticityStrategy
  ): Promise<IResourceDeploymentStatus[]> {
    const resources = await resourceGenerator.generateElasticityStrategyResources(
      elasticityStrategy,
      this.connectionOptions.polarisNamespace
    );

    return await this.deployResources(resources);
  }

  private async deployResources(
    resources: KubernetesObject[]
  ): Promise<IResourceDeploymentStatus[]> {
    const resourceDeploymentStatus = [];
    for (const resource of resources) {
      const existing = await this.client.read(resource);
      try {
        if (existing === null) {
          await this.client.create(resource);
        } else {
          await this.client.patch(resource);
        }
        resourceDeploymentStatus.push({ resource, success: true });
      } catch (e) {
        resourceDeploymentStatus.push({ resource, success: false });
      }
    }
    return resourceDeploymentStatus;
  }
}
