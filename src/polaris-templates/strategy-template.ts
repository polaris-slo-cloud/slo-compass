import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { PolarisController } from '@/workspace/PolarisComponent';

export interface ElasticityStrategyTemplateMetadata {
  key: string;
  name: string;
  description?: string;
  kind: string;
  controllerName: string;
  containerImage: string;
  strategyResources: string;
  sloSpecificConfig: ConfigParameter[];
}

export const templates: ElasticityStrategyTemplateMetadata[] = [
  {
    key: 'horizontalElasticityStrategy',
    name: 'Horizontal Elasticity Strategy',
    description:
      'Provides a simple elasticity strategy to scale resources out and in depending on the SLO compliance',
    kind: 'HorizontalElasticityStrategy',
    controllerName: 'horizontal-elasticity-strategy-controller',
    containerImage: 'polarissloc/horizontal-elasticity-strategy:latest',
    strategyResources: 'horizontalelasticitystrategies',
    sloSpecificConfig: [
      {
        parameter: 'minReplicas',
        type: ParameterType.Integer,
        displayName: 'Minimum Number of Replicas',
        required: false,
      },
      {
        parameter: 'maxReplicas',
        type: ParameterType.Integer,
        displayName: 'Maximum Number of Replicas',
        required: false,
      },
    ],
  },
  {
    key: 'verticalElasticityStrategy',
    name: 'Vertical Elasticity Strategy',
    description:
      'Provides a simple elasticity strategy to scale resources up and down depending on the SLO compliance',
    kind: 'VerticalElasticityStrategy',
    controllerName: 'vertical-elasticity-strategy-controller',
    containerImage: 'polarissloc/vertical-elasticity-strategy:latest',
    strategyResources: 'verticalelasticitystrategies',
    sloSpecificConfig: [
      {
        parameter: 'minResources',
        type: ParameterType.Resources,
        displayName: 'Minimum amount of resources',
        required: true,
      },
      {
        parameter: 'maxResources',
        type: ParameterType.Resources,
        displayName: 'Maximum amount of resources',
        required: true,
      },
      {
        parameter: 'scaleUpPercent',
        type: ParameterType.Percentage,
        displayName: 'Scale up percentage',
        required: false,
      },
      {
        parameter: 'scaleDownPercent',
        type: ParameterType.Percentage,
        displayName: 'Scale down percentage',
        required: false,
      },
    ],
  },
];

export function getTemplate(key: string): ElasticityStrategyTemplateMetadata {
  return templates.find((x) => x.key === key);
}

export function findTemplateForKind(kind: string): ElasticityStrategyTemplateMetadata {
  return templates.find((x) => x.kind === kind);
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
