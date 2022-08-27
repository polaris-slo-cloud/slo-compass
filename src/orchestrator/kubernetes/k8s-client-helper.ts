// DISCLAIMER: The code in this file have been taken from https://github.com/kubernetes-client/javascript/blob/master/src/object.ts and slightly modified
import { KubernetesObject, V1APIResource, V1APIResourceList } from '@kubernetes/client-node';
import {AxiosInstance, AxiosRequestConfig} from 'axios';

/** Kubernetes API verbs. */
type KubernetesApiAction = 'create' | 'delete' | 'patch' | 'read' | 'list' | 'replace';
/**
 * Valid Content-Type header values for patch operations.  See
 * https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/
 * for details.
 */
export enum KubernetesPatchStrategies {
  /** Diff-like JSON format. */
  JsonPatch = 'application/json-patch+json',
  /** Simple merge. */
  MergePatch = 'application/merge-patch+json',
  /** Merge with different strategies depending on field metadata. */
  StrategicMergePatch = 'application/strategic-merge-patch+json',
}

export default class K8sClientHelper {
  private _defaultHeaders = {};
  /** Initialize the default namespace.  May be overwritten by context. */
  protected defaultNamespace = 'default';
  /** Cache resource API response. */
  protected apiVersionResourceCache: Record<string, V1APIResourceList> = {};

  constructor(private http: AxiosInstance) {}

  /**
   * Get metadata from Kubernetes API for resources described by `kind` and `apiVersion`.  If it is unable to find the
   * resource `kind` under the provided `apiVersion`, `undefined` is returned.
   *
   * This method caches responses from the Kubernetes API to use for future requests.  If the cache for apiVersion
   * exists but the kind is not found the request is attempted again.
   *
   * @param apiVersion Kubernetes API version, e.g., 'v1' or 'apps/v1'.
   * @param kind Kubernetes resource kind, e.g., 'Pod' or 'Namespace'.
   * @return Promise of the resource metadata or `undefined` if the resource is not found.
   */
  private async resource(apiVersion: string, kind: string): Promise<V1APIResource | undefined> {
    // verify required parameter 'apiVersion' is not null or undefined
    if (apiVersion === null || apiVersion === undefined) {
      throw new Error('Required parameter apiVersion was null or undefined when calling resource');
    }
    // verify required parameter 'kind' is not null or undefined
    if (kind === null || kind === undefined) {
      throw new Error('Required parameter kind was null or undefined when calling resource');
    }

    if (this.apiVersionResourceCache[apiVersion]) {
      const resource = this.apiVersionResourceCache[apiVersion].resources.find(
        (r) => r.kind === kind
      );
      if (resource) {
        return resource;
      }
    }

    const localVarPath = this.apiVersionPath(apiVersion);
    const localVarQueryParameters = {};
    const localVarHeaderParams = this.generateHeaders({});

    const localVarRequestOptions: AxiosRequestConfig = {
      method: 'GET',
      params: localVarQueryParameters,
      headers: localVarHeaderParams,
      url: localVarPath,
    };

    try {
      const getApiResponse = await this.http.request<V1APIResourceList>(localVarRequestOptions);
      this.apiVersionResourceCache[apiVersion] = getApiResponse.data;
      return this.apiVersionResourceCache[apiVersion].resources.find((r) => r.kind === kind);
    } catch (e) {
      e.message = `Failed to fetch resource metadata for ${apiVersion}/${kind}: ${e.message}`;
      throw e;
    }
  }
  /**
   * Use spec information to construct resource URI path.  If any required information in not provided, an Error is
   * thrown.  If an `apiVersion` is not provided, 'v1' is used.  If a `metadata.namespace` is not provided for a
   * request that requires one, the context default is used, if available, if not, 'default' is used.
   *
   * @param spec Kubernetes resource spec which must define kind and apiVersion properties.
   * @param action API action, see [[K8sApiAction]].
   * @return tail of resource-specific URIDeploym
   */
  public async createSpecUri(spec: KubernetesObject, action: KubernetesApiAction): Promise<string> {
    if (!spec.kind) {
      throw new Error('Required spec property kind is not set');
    }
    if (!spec.apiVersion) {
      spec.apiVersion = 'v1';
    }
    if (!spec.metadata) {
      spec.metadata = {};
    }
    const resource = await this.resource(spec.apiVersion, spec.kind);
    if (!resource) {
      throw new Error(`Unrecognized API version and kind: ${spec.apiVersion} ${spec.kind}`);
    }
    if (resource.namespaced && !spec.metadata.namespace && action !== 'list') {
      spec.metadata.namespace = this.defaultNamespace;
    }
    const parts = [this.apiVersionPath(spec.apiVersion)];
    if (resource.namespaced && spec.metadata.namespace) {
      parts.push('namespaces', encodeURIComponent(String(spec.metadata.namespace)));
    }
    parts.push(resource.name);
    if (action !== 'create' && action !== 'list') {
      if (!spec.metadata.name) {
        throw new Error('Required spec property name is not set');
      }
      parts.push(encodeURIComponent(String(spec.metadata.name)));
    }
    return parts.join('/').toLowerCase();
  }

  /** Return root of API path up to API version. */
  protected apiVersionPath(apiVersion: string): string {
    const api = apiVersion.includes('/') ? 'apis' : 'api';
    return [api, apiVersion].join('/');
  }

  /**
   * Merge default headers and provided headers, setting the 'Accept' header to 'application/json' and, if the
   * `action` is 'PATCH', the 'Content-Type' header to [[KubernetesPatchStrategies.StrategicMergePatch]].  Both of
   * these defaults can be overriden by values provided in `optionsHeaders`.
   *
   * @param optionHeaders Headers from method's options argument.
   * @param action HTTP action headers are being generated for.
   * @return Headers to use in request.
   */
  public generateHeaders(
    optionsHeaders: { [name: string]: string },
    action = 'GET'
  ): { [name: string]: string } {
    const headers: { [name: string]: string } = Object.assign({}, this._defaultHeaders);
    headers.accept = 'application/json';
    if (action === 'PATCH') {
      headers['content-type'] = KubernetesPatchStrategies.StrategicMergePatch;
    }
    Object.assign(headers, optionsHeaders);
    return headers;
  }
}
