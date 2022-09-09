import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import PolarisController from '@/workspace/PolarisComponent';

export interface ElasticityStrategyTemplateMetadata {
  key: string;
  name: string;
  description?: string;
  controllerName: string;
  containerImage: string;
  strategyTypeApiGroup: string;
  strategyResources: string;
  sloSpecificConfig: ConfigParameter[];
}

export const templates: ElasticityStrategyTemplateMetadata[] = [
  {
    key: 'horizontalElasticityStrategy',
    name: 'Horizontal Elasticity Strategy',
    description:
      'Provides a simple elasticity strategy to scale resources out and in depending on the SLO compliance',
    controllerName: 'horizontal-elasticity-strategy-controller',
    containerImage: 'polarissloc/horizontal-elasticity-strategy:latest',
    strategyTypeApiGroup: 'elasticity.polaris-slo-cloud.github.io',
    strategyResources: 'horizontalelasticitystrategies',
    sloSpecificConfig: [
      {
        parameter: 'minReplicas',
        type: ParameterType.Integer,
        displayName: 'Minimum Number of Replicas',
        optional: true,
      },
      {
        parameter: 'maxReplicas',
        type: ParameterType.Integer,
        displayName: 'Maximum Number of Replicas',
        optional: true,
      },
    ],
  },
  {
    key: 'verticalElasticityStrategy',
    name: 'Vertical Elasticity Strategy',
    description:
      'Provides a simple elasticity strategy to scale resources up and down depending on the SLO compliance',
    controllerName: 'vertical-elasticity-strategy-controller',
    containerImage: 'polarissloc/vertical-elasticity-strategy:latest',
    strategyTypeApiGroup: 'elasticity.polaris-slo-cloud.github.io',
    strategyResources: 'verticalelasticitystrategies',
    sloSpecificConfig: [
      {
        parameter: 'minResources',
        type: ParameterType.Resources,
        displayName: 'Minimum amount of resources',
        optional: false,
      },
      {
        parameter: 'maxResources',
        type: ParameterType.Resources,
        displayName: 'Maximum amount of resources',
        optional: false,
      },
      {
        parameter: 'scaleUpPercent',
        type: ParameterType.Percentage,
        displayName: 'Scale up percentage',
        optional: true,
      },
      {
        parameter: 'scaleDownPercent',
        type: ParameterType.Percentage,
        displayName: 'Scale down percentage',
        optional: true,
      },
    ],
  },
];

export function getTemplate(key: string): ElasticityStrategyTemplateMetadata {
  return templates.find((x) => x.key === key);
}

export function getPolarisControllers(
  template: ElasticityStrategyTemplateMetadata
): PolarisController[] {
  return [
    {
      type: 'Elasticity Strategy Controller',
      name: template.controllerName,
      deployment: null,
    },
  ];
}