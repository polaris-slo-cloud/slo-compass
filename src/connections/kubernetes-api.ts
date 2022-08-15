import { IOrchestratorApi } from '@/connections/orchestrator-api';
import axios, { AxiosInstance } from 'axios';

export default class KubernetesApi implements IOrchestratorApi {
  public name = 'Kubernetes';
  private client: AxiosInstance;
  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
  }
  searchDeployments(query: string): Promise<any> {
    return Promise.resolve(undefined);
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
