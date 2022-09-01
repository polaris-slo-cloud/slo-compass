export enum ParameterType {
  Integer = 'Integer',
  Decimal = 'Decimal',
  Resources = 'Resources',
  Percentage = 'Percentage',
}

export interface ConfigParameter {
  parameter: string;
  displayName: string;
  type: ParameterType;
  optional: boolean;
}
