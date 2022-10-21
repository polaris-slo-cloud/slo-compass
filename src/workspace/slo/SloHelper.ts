import { ApiObject, NamespacedObjectReference } from '@polaris-sloc/core';
import Slo, { PolarisSloMapping } from '@/workspace/slo/Slo';
import { useSloStore } from '@/store/slo';
import {WorkspaceComponentId} from "@/workspace/PolarisComponent";

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
export class SloHelper {
  private sloStore = useSloStore();

  public async createOrUpdateSlo(obj: ApiObject<PolarisSloMapping>): Promise<WorkspaceComponentId> {
    const labelMatcher =
      obj.metadata.labels && obj.metadata.labels.polarisId
        ? (slo: Slo) => slo.id === obj.metadata.labels.polarisId
        : () => false;
    const existing = this.sloStore.slos.find((x) => labelMatcher(x) || sloMappingMatches(x.sloMapping, obj));
    if (existing) {
      await this.sloStore.updatePolarisMapping(existing.id, obj.spec);
      return existing.id;
    }

    const reference: NamespacedObjectReference = {
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      kind: obj.objectKind.kind,
      version: obj.objectKind.version,
      group: obj.objectKind.group,
    };
    return await this.sloStore.createFromPolarisMapping(obj.metadata.labels?.polarisId, obj.spec, reference);
  }
}
