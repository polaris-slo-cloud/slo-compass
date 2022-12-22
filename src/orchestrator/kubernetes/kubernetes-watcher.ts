import {
  ApiObject,
  ObjectKind,
  ObjectKindNotFoundError,
  ObjectKindPropertiesMissingError,
  ObjectKindWatcher,
  ObjectKindWatcherError,
  WatchAlreadyStartedError,
  WatchEventsHandler,
  WatchTerminatedError,
} from '@polaris-sloc/core';
import { K8sClient, KubernetesSpecObject } from '@/orchestrator/kubernetes/client';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import {transformK8sOwnerReference, transformToApiObject} from '@/orchestrator/kubernetes/helpers';

const REQUIRED_OBJECT_KIND_PROPERTIES: (keyof ObjectKind)[] = ['version', 'kind'];
export type WatchEventType = 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK';

const DEFAULT_WATCH_TIMEOUT = 10 * 60 * 1000;
export class KubernetesObjectKindWatcher implements ObjectKindWatcher {
  private _handler: WatchEventsHandler;
  private _kind: ObjectKind;
  private _watchRequest;

  private _watchRestartTimeout;

  get handler() {
    return this._handler;
  }
  get kind() {
    return this._kind;
  }
  get isActive() {
    return !!this._handler && !!this._kind && !!this._watchRequest;
  }

  constructor(private client: K8sClient, private bookmarkManager: WatchBookmarkManager) {}

  private onWatchError(error): void {
    let watchError: ObjectKindWatcherError;
    if (error) {
      if ((error as Error)?.message === 'Not Found') {
        watchError = new ObjectKindNotFoundError(this, this._kind);
      } else {
        watchError = new WatchTerminatedError(this, error);
      }
    } else if (this._watchRequest) {
      watchError = new WatchTerminatedError(this, error);
    }
    if (watchError) {
      if (this.isActive) {
        this.handler.onError(watchError);
      } else {
        throw watchError;
      }
    }
    this._watchRequest = null;
    this.stopWatch();
  }

  async startWatch(kind: ObjectKind, handler: WatchEventsHandler): Promise<void> {
    if (this.isActive) {
      throw new WatchAlreadyStartedError(this);
    }
    this.checkIfRequiredPropsArePresent(kind);

    this._kind = kind;
    this._handler = handler;
    const resourceVersion = this.bookmarkManager.find(kind);
    const path = this.getWatchPath(kind);
    const watch = await this.client.watch(
      path,
      resourceVersion,
      async (type: WatchEventType, k8sObj: KubernetesSpecObject) => await this.onK8sWatchEvent(type, k8sObj),
      this.onWatchError.bind(this)
    );
    this._watchRequest = watch;
  }

  stopWatch(): void {
    if (this._watchRequest) {
      this._watchRequest.abort();
      this._watchRequest = null;
    }
    if (this._watchRestartTimeout) {
      clearTimeout(this._watchRestartTimeout);
      this._watchRestartTimeout = null;
    }
    this._kind = null;
    this._handler = null;
  }

  private async restartWatch() {
    const kind = this._kind;
    const handler = this._handler;
    this.stopWatch();
    await this.startWatch(kind, handler);
  }

  private resetRestartTimeout() {
    if (this._watchRestartTimeout) {
      clearTimeout(this._watchRestartTimeout);
    }
    this._watchRestartTimeout = setTimeout(this.restartWatch.bind(this), DEFAULT_WATCH_TIMEOUT);
  }

  private async onK8sWatchEvent(type: WatchEventType, k8sObject: KubernetesSpecObject): Promise<void> {
    this.resetRestartTimeout();
    const apiObject = transformToApiObject(k8sObject, this._kind);
    switch (type) {
      case 'ADDED':
        await this._handler.onObjectAdded(apiObject);
        break;
      case 'MODIFIED':
        await this._handler.onObjectModified(apiObject);
        break;
      case 'DELETED':
        await this._handler.onObjectDeleted(apiObject);
        break;
      case 'BOOKMARK':
        this.bookmarkManager.update(this._kind, k8sObject.metadata.resourceVersion);
    }
  }

  private getWatchPath(kind: ObjectKind): string {
    const pathStart = kind.group ? `/apis/${kind.group}` : '/api';
    const path = `${pathStart}/${kind.version}/${this.getKindPlural(kind.kind)}`;
    return path.toLowerCase();
  }

  private getKindPlural(kind: string): string {
    if (kind.endsWith('y')) {
      return kind.substring(0, kind.length - 1) + 'ies';
    }
    return kind + 's';
  }

  private checkIfRequiredPropsArePresent(kind: ObjectKind): void {
    const missingProps = REQUIRED_OBJECT_KIND_PROPERTIES.filter((prop) => !kind[prop]);
    if (missingProps.length > 0) {
      throw new ObjectKindPropertiesMissingError(this, kind, missingProps);
    }
  }
}
