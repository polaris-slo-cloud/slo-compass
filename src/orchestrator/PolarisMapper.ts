import { PolarisElasticityStrategySloOutput, PolarisSloMapping } from '@/workspace/slo/Slo';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { ApiObject } from '@polaris-sloc/core';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { PolarisController } from '@/workspace/PolarisComponent';

export interface PolarisMapper {
  transformToPolarisSloMapping(spec: any, namespace: string): PolarisSloMapping;
  isSloTemplateCrd(crd: ApiObject<any>): boolean;
  mapCrdToSloTemplate(crd: ApiObject<any>): SloTemplateMetadata;
  isElasticityStrategyCrd(crd: ApiObject<any>): boolean;
  mapCrdToElasticityStrategy(crd: ApiObject<any>): ElasticityStrategy;
  transformToPolarisElasticityStrategySloOutput(spec: any, namespace: string): PolarisElasticityStrategySloOutput;
  mapToPolarisController(deployment: ApiObject<any>): PolarisController;
}
