export enum ParameterType {
  Integer = 'Integer',
  Decimal = 'Decimal',
  Resources = 'Resources',
  Percentage = 'Percentage',
}

export interface IConfigParameter {
  parameter: string;
  displayName: string;
  type: ParameterType;
  optional: boolean;
}
