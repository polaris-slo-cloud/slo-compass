import { ElasticityStrategyParameterType } from '@/polaris-templates/parameters';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { workspaceItemTypes } from '@/workspace/constants';
import { PolarisController } from '@/workspace/PolarisComponent';

export const defaultStrategies: ElasticityStrategy[] = [
  {
    id: 'default-horizontal-elasticity-strategy',
    name: 'Horizontal Elasticity Strategy',
    type: workspaceItemTypes.elasticityStrategy,
    description: 'Provides a simple elasticity strategy to scale resources out and in depending on the SLO compliance',
    kind: 'HorizontalElasticityStrategy',
    kindPlural: 'horizontalelasticitystrategies',
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
    id: 'default-vertical-elasticity-strategy',
    name: 'Vertical Elasticity Strategy',
    type: workspaceItemTypes.elasticityStrategy,
    description: 'Provides a simple elasticity strategy to scale resources up and down depending on the SLO compliance',
    kind: 'VerticalElasticityStrategy',
    kindPlural: 'verticalelasticitystrategies',
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

export const defaultElasticityStrategyControllers: PolarisController[] = [
  {
    type: 'Elasticity Strategy Controller',
    handlesKind: 'HorizontalElasticityStrategy',
    deploymentMetadata: {
      name: 'horizontal-elasticity-strategy-controller',
      containerImage: 'polarissloc/horizontal-elasticity-strategy:latest',
    },
  },
  {
    type: 'Elasticity Strategy Controller',
    handlesKind: 'VerticalElasticityStrategy',
    deploymentMetadata: {
      name: 'vertical-elasticity-strategy-controller',
      containerImage: 'polarissloc/vertical-elasticity-strategy:latest',
    },
  },
];
