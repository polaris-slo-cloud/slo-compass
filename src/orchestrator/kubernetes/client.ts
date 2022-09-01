import axios, { AxiosInstance } from 'axios';
import { KubernetesObject, V1DeploymentList } from '@kubernetes/client-node';
import K8sClientHelper, {
  KubernetesPatchStrategies,
} from '@/orchestrator/kubernetes/k8s-client-helper';

export interface K8sClient {
  listAllDeployments(): Promise<V1DeploymentList>;
  read<TResource extends KubernetesObject>(spec: TResource): Promise<TResource>;
  create<TResource extends KubernetesObject>(resource: TResource): Promise<TResource>;
  patch<TResource extends KubernetesObject>(resource: TResource): Promise<TResource>;
  test(): Promise<boolean>;
}
interface K8sNativeClient extends K8sClient {
  connectToContext(context);
}

declare global {
  interface Window {
    k8sApi: K8sNativeClient;
  }
}

class K8sHttpClient implements K8sClient {
  private readonly http: AxiosInstance;
  private readonly helper: K8sClientHelper;
  constructor(baseURL: string) {
    this.http = axios.create({ baseURL });
    this.helper = new K8sClientHelper(this.http);
  }

  public async listAllDeployments(): Promise<V1DeploymentList> {
    const { data } = await this.http.get<V1DeploymentList>('/apis/apps/v1/deployments');
    return data;
  }

  public async read<TResource extends KubernetesObject>(spec: TResource): Promise<TResource> {
    try {
      const url = await this.helper.createSpecUri(spec, 'read');
      const headers = this.helper.generateHeaders({}, 'READ');
      const { data } = await this.http.get<TResource>(url, { headers });
      return data;
    } catch (e) {
      return null;
    }
  }

  public async create<TResource extends KubernetesObject>(resource: TResource): Promise<TResource> {
    const url = await this.helper.createSpecUri(resource, 'create');
    const headers = this.helper.generateHeaders({}, 'CREATE');
    const { data } = await this.http.post(url, resource, { headers });
    return data;
  }

  public async patch<TResource extends KubernetesObject>(resource: TResource): Promise<TResource> {
    const url = await this.helper.createSpecUri(resource, 'patch');
    const headers = this.helper.generateHeaders({}, 'PATCH');
    // The ServiceMonitor type is not able to handle the default StrategicMergePatch
    if (resource.kind === 'ServiceMonitor') {
      headers['content-type'] = KubernetesPatchStrategies.MergePatch;
    }
    const { data } = await this.http.patch(url, resource, { headers });
    return data;
  }

  public async test(): Promise<boolean> {
    try {
      await this.http.get('/api/v1/namespaces');
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default function createClient(connectionSettings: string): K8sClient {
  if (window.k8sApi) {
    window.k8sApi.connectToContext(connectionSettings);
    return window.k8sApi;
  }
  return new K8sHttpClient(connectionSettings);
}
