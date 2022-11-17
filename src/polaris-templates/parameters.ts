export enum ParameterType {
  Integer = 'Integer',
  Decimal = 'Decimal',
  Percentage = 'Percentage',
}

export enum ElasticityStrategyParameterType {
  Integer = 'Integer',
  Decimal = 'Decimal',
  Percentage = 'Percentage',
  Resources = 'Resources',
}

export interface ElasticityStrategyConfigParameter {
  parameter: string;
  displayName: string;
  type: ElasticityStrategyParameterType;
  required: boolean;
}

export interface ConfigParameter {
  parameter: string;
  displayName: string;
  type: ParameterType;
  required: boolean;
}
