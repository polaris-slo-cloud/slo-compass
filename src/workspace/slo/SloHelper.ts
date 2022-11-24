import { ApiObject, NamespacedObjectReference, OwnerReference } from '@polaris-sloc/core';
import Slo, { PolarisSloMapping } from '@/workspace/slo/Slo';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { WorkspaceComponentId } from '@/workspace/PolarisComponent';
import * as _ from 'lodash';

export function sloMappingMatches(sloMapping: NamespacedObjectReference, obj: ApiObject<PolarisSloMapping>): boolean {
  return (
    !!sloMapping &&
    sloMapping.name === obj.metadata.name &&
    sloMapping.namespace === obj.metadata.namespace &&
    sloMapping.kind === obj.objectKind.kind &&
    sloMapping.group === obj.objectKind.group &&
    sloMapping.version === obj.objectKind.version
  );
}

export function ownerToNamespacedObjectReference(
  sloOwnerReference: OwnerReference,
  namespace: string
): NamespacedObjectReference {
  return {
    name: sloOwnerReference.name,
    namespace,
    group: sloOwnerReference.group,
    version: sloOwnerReference.version,
    kind: sloOwnerReference.kind,
  };
}
export class SloHelper {
  private sloStore = useSloStore();
  private targetStore = useTargetStore();

  public async createOrUpdateSlo(obj: ApiObject<PolarisSloMapping>): Promise<WorkspaceComponentId> {
    const labelMatcher =
      obj.metadata.labels && obj.metadata.labels.polarisId
        ? (slo: Slo) => slo.id === obj.metadata.labels.polarisId
        : () => false;
    const existing = this.sloStore.slos.find(
      (x) => labelMatcher(x) || sloMappingMatches(x.deployedSloMapping.reference, obj)
    );
    const reference: NamespacedObjectReference = {
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      kind: obj.objectKind.kind,
      version: obj.objectKind.version,
      group: obj.objectKind.group,
    };
    if (existing) {
      await this.sloStore.updatePolarisMapping(existing.id, obj.spec, reference);
      return existing.id;
    }

    return await this.sloStore.createFromPolarisMapping(obj.metadata.labels?.polarisId, obj.spec, reference);
  }

  public sloMappingChanged(slo: Slo) {
    const configChanged = !_.isEqual(slo.config, slo.deployedSloMapping?.sloMapping?.config);
    const elasticityStrategyConfigChanged = !_.isEqual(
      slo.elasticityStrategy.config,
      slo.deployedSloMapping?.sloMapping?.elasticityStrategyConfig
    );

    const sloTarget = slo.target ? this.targetStore.getSloTarget(slo.target) : null;
    const targetChanged = !_.isEqual(
      sloTarget.deployment.connectionMetadata,
      slo.deployedSloMapping?.sloMapping?.target
    );
    const elasticityStrategyChanged =
      slo.elasticityStrategy.kind !== slo.deployedSloMapping?.sloMapping?.elasticityStrategy.kind;

    return configChanged || elasticityStrategyConfigChanged || targetChanged || elasticityStrategyChanged;
  }
}
