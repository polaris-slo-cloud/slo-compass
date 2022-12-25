import { ApiObject, ObjectKind, POLARIS_API } from '@polaris-sloc/core';
import { useSloStore } from '@/store/slo';
import { PolarisSloMapping } from '@/workspace/slo/Slo';
import { SloHelper, sloMappingMatches } from '@/workspace/slo/SloHelper';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { ChangeTrackingWatchEventsHandler } from '@/orchestrator/WatchEventsHandler';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';

export function toSloMappingObjectKind(mappingKind: string): ObjectKind {
  return {
    kind: mappingKind,
    group: POLARIS_API.SLO_GROUP,
    version: 'v1',
  };
}

export class SloMappingWatchHandler implements ChangeTrackingWatchEventsHandler {
  private readonly orchestratorApi = useOrchestratorApi();
  private readonly sloStore = useSloStore();
  private readonly helper = new SloHelper();
  private readonly polarisMapper: PolarisMapper;

  constructor(private bookmarkManager: WatchBookmarkManager) {
    this.polarisMapper = this.orchestratorApi.createPolarisMapper();
  }

  onError(error: Error): void {
    //TODO:
  }

  private transform(obj: ApiObject<any>): ApiObject<PolarisSloMapping> {
    return {
      ...obj,
      spec: this.polarisMapper.transformToPolarisSloMapping(obj.spec, obj.metadata.namespace),
    };
  }

  async onObjectAdded(obj: ApiObject<any>): Promise<void> {
    const sloMapping = this.transform(obj);
    await this.helper.createOrUpdateSlo(sloMapping);
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    const sloMapping = this.transform(obj);
    const existing = this.sloStore.slos.find((x) => sloMappingMatches(x.deployedSloMapping?.reference, sloMapping));
    if (existing) {
      this.sloStore.polarisMappingRemoved([existing.id]);
    }
  }

  async onObjectModified(obj: ApiObject<any>): Promise<void> {
    const sloMapping = this.transform(obj);
    await this.helper.createOrUpdateSlo(sloMapping);
  }

  async loadLatestResourceVersion(objectKind: ObjectKind): Promise<void> {
    const sloMappings = await this.orchestratorApi.findSloMappings(objectKind);
    const mappedSlos = [];
    for (const sloMapping of sloMappings.items) {
      const sloId = await this.helper.createOrUpdateSlo(sloMapping);
      mappedSlos.push(sloId);
    }
    const deletedSlos = this.sloStore.slos
      .filter(
        (x) =>
          !!x.deployedSloMapping?.reference &&
          x.deployedSloMapping.reference.kind === objectKind.kind &&
          !mappedSlos.includes(x.id)
      )
      .map((x) => x.id);
    if (deletedSlos.length > 0) {
      this.sloStore.polarisMappingRemoved(deletedSlos);
    }
    this.bookmarkManager.update(objectKind, sloMappings.metadata.resourceVersion);
  }
}
