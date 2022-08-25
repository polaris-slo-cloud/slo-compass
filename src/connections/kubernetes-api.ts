import { IDeployment, IOrchestratorApi } from '@/connections/orchestrator-api';
import axios, { AxiosInstance } from 'axios';

export default class KubernetesApi implements IOrchestratorApi {
  public name = 'Kubernetes';
  private client: AxiosInstance;
  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
  }
  async findDeployments(query?: string): Promise<IDeployment[]> {
    try {
      const { data } = await this.client.get('/apis/apps/v1/deployments');
      const items = data.items.map((x) => ({
        id: x.metadata.uid,
        name: x.metadata.name,
        status: x.status.conditions[x.status.conditions.length - 1].type,
        connectionMetadata: { name: x.metadata.name, namespace: x.metadata.namespace },
      }));
      const lowerCaseQuery = query?.toLowerCase();
      return query ? items.filter((x) => x.name.toLowerCase().includes(lowerCaseQuery)) : items;
    } catch (e) {
      return [];
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/namespaces');
      return true;
    } catch (e) {
      return false;
    }
  }
}
