import {IConfigParameter, ParameterType} from "@/polaris-templates/parameters";

export interface IElasticityStrategyTemplateMetadata {
  key: string;
  name: string;
  description?: string;
  controllerName: string;
  containerImage: string;
  strategyTypeApiGroup: string;
  strategyResources: string;
  sloSpecificConfig: IConfigParameter[];
}

export const templates: IElasticityStrategyTemplateMetadata[] = [
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
