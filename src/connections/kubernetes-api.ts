import {IDeployment, IOrchestratorApi} from '@/connections/orchestrator-api';
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
      return data.items.map((x) => ({ name: x.metadata.name }));
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
