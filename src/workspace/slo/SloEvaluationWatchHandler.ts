import { ApiObject, WatchEventsHandler } from '@polaris-sloc/core';
import { useSloStore } from '@/store/slo';
import { ownerToNamespacedObjectReference } from '@/workspace/slo/SloHelper';
import { PolarisElasticityStrategySloOutput } from '@/workspace/slo/Slo';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';

export class SloEvaluationWatchHandler implements WatchEventsHandler {
  private sloStore = useSloStore();
  private readonly polarisMapper: PolarisMapper;

  constructor() {
    const orchestratorApi = useOrchestratorApi();
    this.polarisMapper = orchestratorApi.createPolarisMapper();
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

  private transform(obj: ApiObject<any>): ApiObject<PolarisElasticityStrategySloOutput> {
    return {
      ...obj,
      spec: this.polarisMapper.transformToPolarisElasticityStrategySloOutput(obj.spec, obj.metadata.namespace),
    };
  }
}
