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
  valueOptions?: any[];
  required: boolean;
}

export interface ConfigParameter {
  parameter: string;
  displayName: string;
  type: ParameterType;
  valueOptions?: any[];
  required: boolean;
}

export function convertToConfigParameterType(value: any, type: ParameterType): any {
  switch (type) {
    case ParameterType.Decimal:
    case ParameterType.Percentage:
    case ParameterType.Integer:
      return Number(value);
  }
  return value;
}

export function convertToElasticityStrategyConfigParameterType(value: any, type: ElasticityStrategyParameterType): any {
  switch (type) {
    case ElasticityStrategyParameterType.Decimal:
    case ElasticityStrategyParameterType.Percentage:
    case ElasticityStrategyParameterType.Integer:
      return Number(value);
    case ElasticityStrategyParameterType.Resources:
      return { ...value };
  }
  return value;
}
