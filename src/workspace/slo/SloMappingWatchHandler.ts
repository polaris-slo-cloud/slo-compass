import { ApiObject, ObjectKind, POLARIS_API, WatchEventsHandler } from '@polaris-sloc/core';
import { useSloStore } from '@/store/slo';
import { PolarisSloMapping } from '@/workspace/slo/Slo';
import { SloHelper, sloMappingMatches } from '@/workspace/slo/SloHelper';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';

export function toSloMappingObjectKind(mappingKind: string): ObjectKind {
  return {
    kind: mappingKind,
    group: POLARIS_API.SLO_GROUP,
    version: 'v1',
  };
}

export class SloMappingWatchHandler implements WatchEventsHandler {
  private sloStore = useSloStore();
  private helper = new SloHelper();
  private readonly polarisMapper: PolarisMapper;

  constructor() {
    const orchestratorApi = useOrchestratorApi();
    this.polarisMapper = orchestratorApi.createPolarisMapper();
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
}
