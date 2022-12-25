import { ApiObject, ObjectKind } from '@polaris-sloc/core';
import { useSloStore } from '@/store/slo';
import { ownerToNamespacedObjectReference } from '@/workspace/slo/SloHelper';
import { PolarisElasticityStrategySloOutput } from '@/workspace/slo/Slo';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { ChangeTrackingWatchEventsHandler } from '@/orchestrator/WatchEventsHandler';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';

export class SloEvaluationWatchHandler implements ChangeTrackingWatchEventsHandler {
  private readonly orchestratorApi = useOrchestratorApi();
  private readonly sloStore = useSloStore();
  private readonly polarisMapper: PolarisMapper;

  constructor(private bookmarkManager: WatchBookmarkManager) {
    this.polarisMapper = this.orchestratorApi.createPolarisMapper();
  }
  onError(error: Error): void {
    //TODO:
  }

  onObjectAdded(obj: ApiObject<any>): void {
    const sloOutput = this.transform(obj);
    const sloReference = ownerToNamespacedObjectReference(
      sloOutput.metadata.ownerReferences[0],
      sloOutput.metadata.namespace
    );
    this.sloStore.updateSloCompliance(sloReference, sloOutput.spec.sloOutputParams.currSloCompliancePercentage);
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    const sloOutput = this.transform(obj);
    const sloReference = ownerToNamespacedObjectReference(
      sloOutput.metadata.ownerReferences[0],
      sloOutput.metadata.namespace
    );
    this.sloStore.updateSloCompliance(sloReference, undefined);
  }

  onObjectModified(obj: ApiObject<any>): void {
    const sloOutput = this.transform(obj);
    const sloReference = ownerToNamespacedObjectReference(
      sloOutput.metadata.ownerReferences[0],
      sloOutput.metadata.namespace
    );
    this.sloStore.updateSloCompliance(sloReference, sloOutput.spec.sloOutputParams.currSloCompliancePercentage);
  }

  async loadLatestResourceVersion(objectKind: ObjectKind): Promise<void> {
    const sloCompliances = await this.orchestratorApi.findSloCompliances(objectKind);
    for (const obj of sloCompliances.items) {
      const sloReference = ownerToNamespacedObjectReference(obj.metadata.ownerReferences[0], obj.metadata.namespace);
      this.sloStore.updateSloCompliance(sloReference, obj.spec.sloOutputParams.currSloCompliancePercentage);
    }
    this.bookmarkManager.update(objectKind, sloCompliances.metadata.resourceVersion);
  }

  private transform(obj: ApiObject<any>): ApiObject<PolarisElasticityStrategySloOutput> {
    return {
      ...obj,
      spec: this.polarisMapper.transformToPolarisElasticityStrategySloOutput(obj.spec, obj.metadata.namespace),
    };
  }
}
