import { PolarisElasticityStrategySloOutput, PolarisSloMapping } from '@/workspace/slo/Slo';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { ApiObject } from '@polaris-sloc/core';
import { ElasticityStrategyTemplateMetadata } from '@/polaris-templates/strategy-template';

export interface PolarisMapper {
  transformToPolarisSloMapping(spec: any, namespace: string): PolarisSloMapping;
  isSloTemplateCrd(crd: ApiObject<any>): boolean;
  mapCrdToSloTemplate(crd: ApiObject<any>): SloTemplateMetadata;
  isElasticityStrategyCrd(crd: ApiObject<any>): boolean;
  mapCrdToElasticityStrategyTemplate(crd: ApiObject<any>): ElasticityStrategyTemplateMetadata;
  transformToPolarisElasticityStrategySloOutput(spec: any, namespace: string): PolarisElasticityStrategySloOutput;
}
