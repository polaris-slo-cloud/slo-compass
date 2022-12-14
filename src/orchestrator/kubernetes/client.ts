import axios, { AxiosInstance } from 'axios';
import {
  KubernetesListObject,
  KubernetesObject,
  V1APIResource,
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1ClusterRoleBindingList,
  V1ClusterRoleList,
  V1CustomResourceDefinition,
  V1CustomResourceDefinitionList,
  V1DeploymentList,
} from '@kubernetes/client-node';
import K8sClientHelper, { KubernetesPatchStrategies } from '@/orchestrator/kubernetes/k8s-client-helper';
import { ApiObjectList, CustomResourceObjectReference } from '@/orchestrator/orchestrator-api';
import { ApiObject, ObjectKind } from '@polaris-sloc/core';
import { WatchEventType } from '@/orchestrator/kubernetes/kubernetes-watcher';

export interface KubernetesSpecObject extends KubernetesObject {
  spec: any;
}

export interface K8sClient {
  listNamespacedDeployments(namespace: string): Promise<V1DeploymentList>;
  listAllDeployments(): Promise<V1DeploymentList>;
  read<TResource extends KubernetesObject>(spec: TResource): Promise<TResource>;
  create<TResource extends KubernetesObject>(resource: TResource): Promise<TResource>;
  patch<TResource extends KubernetesObject>(resource: TResource): Promise<TResource>;
  test(): Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCustomResourceObject(identifier: CustomResourceObjectReference): Promise<ApiObject<any>>;
  deleteCustomResourceObject(identifier: CustomResourceObjectReference): Promise<void>;
  listCustomResourceObjects(objectKind: ObjectKind, plural: string): Promise<KubernetesListObject<any>>;
  listCustomResourceDefinitions(): Promise<V1CustomResourceDefinitionList>;
  findCustomResourceDefinition(plural: string, apiGroup: string): Promise<V1CustomResourceDefinition>;
  findCustomResourceMetadata(apiVersion: string, kind: string): Promise<V1APIResource>;
  watch(
    path: string,
    resourceVersion: string,
    watchCallback: (type: WatchEventType, k8sObj: KubernetesSpecObject) => Promise<void>,
    errorCallback: (error: any) => void
  ): Promise<any>;
  listClusterRoles(): Promise<V1ClusterRoleList>;
  findClusterRole(name: string): Promise<V1ClusterRole>;
  listClusterRoleBindings(): Promise<V1ClusterRoleBindingList>;
}
interface K8sNativeClient extends K8sClient {
  connectToContext(context);
  abortWatch(requestKey);
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

  public async listNamespacedDeployments(namespace: string): Promise<V1DeploymentList> {
    const { data } = await this.http.get<V1DeploymentList>(`/apis/apps/v1/namespaces/${namespace}/deployments`);
    return data;
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
    // The ServiceMonitor type and Polaris Custom Objects are not able to handle the default StrategicMergePatch
    if (resource.kind === 'ServiceMonitor' || resource.apiVersion.includes('polaris')) {
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

  async listCustomResourceDefinitions(): Promise<V1CustomResourceDefinitionList> {
    const { data } = await this.http.get<V1CustomResourceDefinitionList>(
      '/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
    );
    return data;
  }

  async findCustomResourceDefinition(plural: string, apiGroup: string): Promise<V1CustomResourceDefinition> {
    const { data } = await this.http.get<V1CustomResourceDefinition>(
      `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${plural}.${apiGroup}`
    );
    return data;
  }

  async getCustomResourceObject(identifier: CustomResourceObjectReference): Promise<any> {
    const { data } = await this.http.get(
      `/apis/${identifier.group}/${identifier.version}/namespaces/${identifier.namespace}/${identifier.plural}/${identifier.name}`
    );
    return data;
  }

  async deleteCustomResourceObject(identifier: CustomResourceObjectReference): Promise<void> {
    await this.http.delete(
      `/apis/${identifier.group}/${identifier.version}/namespaces/${identifier.namespace}/${identifier.plural}/${identifier.name}`
    );
  }

  async listCustomResourceObjects(objectKind: ObjectKind, plural: string): Promise<ApiObjectList<any>> {
    const { data } = await this.http.get(`/apis/${objectKind.group}/${objectKind.version}/${plural}`);
    return data;
  }

  async findCustomResourceMetadata(apiVersion: string, kind: string): Promise<V1APIResource> {
    return await this.helper.resource(apiVersion, kind);
  }

  public async watch(
    path: string,
    resourceVersion: string,
    watchCallback: (type: WatchEventType, k8sObj: KubernetesSpecObject) => Promise<void>,
    errorCallback: (error: any) => void
  ): Promise<any> {
    const params: Record<string, any> = { watch: true, allowWatchBookmarks: true };
    if (resourceVersion) {
      params.resourceVersion = resourceVersion;
    }

    const watch = new HttpClientWatch(this.http, watchCallback, errorCallback);
    return watch.watch(path, { params });
  }

  public async listClusterRoleBindings(): Promise<V1ClusterRoleBindingList> {
    const { data } = await this.http.get('/apis/rbac.authorization.k8s.io/v1/clusterrolebindings');
    return data;
  }

  public async listClusterRoles(): Promise<V1ClusterRoleList> {
    const { data } = await this.http.get('/apis/rbac.authorization.k8s.io/v1/clusterroles');
    return data;
  }

  public async findClusterRole(name: string): Promise<V1ClusterRole> {
    const { data } = await this.http.get(`/apis/rbac.authorization.k8s.io/v1/clusterroles/${name}`);
    return data;
  }
}

export default function createClient(connectionSettings: string): K8sClient {
  if (window.k8sApi) {
    window.k8sApi.connectToContext(connectionSettings);
    return {
      ...window.k8sApi,
      watch: async (...options) => {
        const requestKey = await window.k8sApi.watch(...options);
        return {
          abort: () => window.k8sApi.abortWatch(requestKey),
        };
      },
    };
  }
  return new K8sHttpClient(connectionSettings);
}

function tryJsonParse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

class HttpClientWatch {
  private watchIndex = 0;

  constructor(
    private http: AxiosInstance,
    private watchCallback: (type: WatchEventType, k8sObj: KubernetesSpecObject) => Promise<void>,
    private errorCallback: (error: any) => void
  ) {}

  public async watch(url, options): Promise<AbortController> {
    try {
      const controller = new AbortController();
      this.http
        .get(url, {
          signal: controller.signal,
          onDownloadProgress: this.processWatchEvent.bind(this),
          ...options,
        })
        // The watch has been terminated if the request finishes
        .then(() => this.errorCallback(null));
      return controller;
    } catch (e) {
      this.errorCallback(e);
    }
  }

  private async processWatchEvent(event: any): Promise<void> {
    const lines = event.currentTarget.response.split('\n');
    const data = lines
      .filter((x) => !!x)
      .map(tryJsonParse)
      .filter((x) => !!x)
      .slice(this.watchIndex);
    for (const watchEvent of data) {
      await this.watchCallback(watchEvent.type, watchEvent.object);
      this.watchIndex++;
    }
  }
}
