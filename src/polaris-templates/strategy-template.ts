import { ElasticityStrategyConfigParameter, ElasticityStrategyParameterType } from '@/polaris-templates/parameters';
import { PolarisController } from '@/workspace/PolarisComponent';

export interface ElasticityStrategyTemplateMetadata {
  elasticityStrategyKind: string;
  elasticityStrategyKindPlural: string;
  displayName: string;
  description?: string;
  controllerName: string;
  containerImage: string;
  sloSpecificConfig: ElasticityStrategyConfigParameter[];
  confirmed: boolean;
}

export const templates: ElasticityStrategyTemplateMetadata[] = [
  {
    elasticityStrategyKind: 'HorizontalElasticityStrategy',
    elasticityStrategyKindPlural: 'horizontalelasticitystrategies',
    displayName: 'Horizontal Elasticity Strategy',
    description: 'Provides a simple elasticity strategy to scale resources out and in depending on the SLO compliance',
    controllerName: 'horizontal-elasticity-strategy-controller',
    containerImage: 'polarissloc/horizontal-elasticity-strategy:latest',
    sloSpecificConfig: [
      {
        parameter: 'minReplicas',
        type: ElasticityStrategyParameterType.Integer,
        displayName: 'Minimum Number of Replicas',
        required: false,
      },
      {
        parameter: 'maxReplicas',
        type: ElasticityStrategyParameterType.Integer,
        displayName: 'Maximum Number of Replicas',
        required: false,
      },
    ],
    confirmed: true,
  },
  {
    elasticityStrategyKind: 'VerticalElasticityStrategy',
    elasticityStrategyKindPlural: 'verticalelasticitystrategies',
    displayName: 'Vertical Elasticity Strategy',
    description: 'Provides a simple elasticity strategy to scale resources up and down depending on the SLO compliance',
    controllerName: 'vertical-elasticity-strategy-controller',
    containerImage: 'polarissloc/vertical-elasticity-strategy:latest',
    sloSpecificConfig: [
      {
        parameter: 'minResources',
        type: ElasticityStrategyParameterType.Resources,
        displayName: 'Minimum amount of resources',
        required: true,
      },
      {
        parameter: 'maxResources',
        type: ElasticityStrategyParameterType.Resources,
        displayName: 'Maximum amount of resources',
        required: true,
      },
      {
        parameter: 'scaleUpPercent',
        type: ElasticityStrategyParameterType.Percentage,
        displayName: 'Scale up percentage',
        required: false,
      },
      {
        parameter: 'scaleDownPercent',
        type: ElasticityStrategyParameterType.Percentage,
        displayName: 'Scale down percentage',
        required: false,
      },
    ],
    confirmed: true,
  },
];

export function getPolarisControllers(template: ElasticityStrategyTemplateMetadata): PolarisController[] {
  return [
    {
      type: 'Elasticity Strategy Controller',
      name: template.controllerName,
      deployment: null,
    },
  ];
}
