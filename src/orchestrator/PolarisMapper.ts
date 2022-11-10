import { PolarisSloMapping } from '@/workspace/slo/Slo';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { ApiObject } from '@polaris-sloc/core';

export interface PolarisMapper {
  transformToPolarisSloMapping(spec: any, namespace: string): PolarisSloMapping;
  isSloTemplateCrd(crd: ApiObject<any>): boolean;
  mapCrdToSloTemplate(crd: ApiObject<any>): SloTemplateMetadata;
}
