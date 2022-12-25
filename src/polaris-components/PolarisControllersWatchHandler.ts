import { ApiObject, ObjectKind } from '@polaris-sloc/core';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import {
  ChangeTrackingWatchEventsHandler,
  WatchEventsHandlerWithQueryOptions,
} from '@/orchestrator/WatchEventsHandler';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';
import { OrchestratorLabelFilters } from '@/orchestrator/ObjectKindQueryOptions';

export class PolarisControllersWatchHandler
  implements ChangeTrackingWatchEventsHandler, WatchEventsHandlerWithQueryOptions
{
  private readonly orchestratorApi = useOrchestratorApi();
  private readonly polarisComponentStore = usePolarisComponentStore();
  private readonly polarisMapper: PolarisMapper;

  constructor(private bookmarkManager: WatchBookmarkManager) {
    this.polarisMapper = this.orchestratorApi.createPolarisMapper();
  }

  public watchQueryOptions = {
    labelFilter: [OrchestratorLabelFilters.equals('tier', 'control-plane')],
  };

  onError(error: Error): void {
    //TODO
  }

  async onObjectAdded(obj: ApiObject<any>): Promise<void> {
    let polarisController = this.polarisMapper.mapToPolarisController(obj);
    if (!polarisController) {
      polarisController = await this.orchestratorApi.findPolarisControllerForDeployment(obj);
    }
    if (polarisController) {
      this.polarisComponentStore.addPolarisControllerFromCluster(polarisController);
    }
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    this.polarisComponentStore.polarisControllerRemovedFromCluster(obj.metadata.namespace, obj.metadata.name);
  }

  onObjectModified(obj: ApiObject<any>): void {
    // Do nothing
  }

  async loadLatestResourceVersion(objectKind: ObjectKind): Promise<void> {
    const polarisControllers = await this.orchestratorApi.findPolarisControllers();
    this.polarisComponentStore.initializePolarisClusterComponents(polarisControllers.items);
    this.bookmarkManager.update(objectKind, polarisControllers.resourceVersion);
  }
}
