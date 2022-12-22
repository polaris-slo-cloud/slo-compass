import { PolarisControllerType } from '@/workspace/PolarisComponent';

export const COMMON_LABELS = Object.freeze({
  CONTROLLER_TYPE: 'polaris-slo-cloud.github.io/controller',
  CRD_API_GROUP: 'polaris-slo-cloud.github.io/crd-api-group',
  CRD_NAME: 'polaris-slo-cloud.github.io/crd-name',
});

export const CONTROLLER_TYPES = Object.freeze({
  SLO: 'slo',
  ELASTICITY_STRATEGY: 'elasticity-strategy',
  COMPOSED_METRIC: 'composed-metric',
});

export const ControllerTypeMap: Record<string, PolarisControllerType> = Object.freeze({
  [CONTROLLER_TYPES.SLO]: PolarisControllerType.Slo,
  [CONTROLLER_TYPES.COMPOSED_METRIC]: PolarisControllerType.Metric,
  [CONTROLLER_TYPES.ELASTICITY_STRATEGY]: PolarisControllerType.ElasticityStrategy,
});
