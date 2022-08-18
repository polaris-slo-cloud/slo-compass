export interface ISloTemplateMetadata {
  key: string;
  name: string;
  description?: string;
  config: ISloParameter[];
}

export enum ParameterType {
  Integer,
  Decimal,
}

export interface ISloParameter {
  parameter: string;
  displayName: string;
  type: ParameterType;
  optional: boolean;
}

const templates: ISloTemplateMetadata[] = [
  {
    key: 'costEfficiencySlo',
    name: 'Cost Efficiency',
    description:
      'This SLO calculates a cost efficiency using the response time and cost of the target',
    config: [
      {
        parameter: 'responseTimeThresholdMs',
        displayName: 'Response Time Threshold (in ms)',
        type: ParameterType.Integer,
        optional: false,
      },
      {
        parameter: 'targetCostEfficiency',
        displayName: 'Cost Efficiency Target',
        type: ParameterType.Decimal,
        optional: false,
      },
      {
        parameter: 'minRequestsPercentile',
        displayName: 'Minimum Requests Percentile',
        type: ParameterType.Decimal,
        optional: true,
      },
    ],
  },
  {
    key: 'cpuUsageSlo',
    name: 'CPU Usage',
    description: 'This SLO utilizes the CPU usage metrics to calculate its compliance',
    config: [
      {
        parameter: 'targetAvgCPUUtilizationPercentage',
        displayName: 'Average CPU Utilization Target',
        type: ParameterType.Decimal,
        optional: false,
      },
    ],
  },
];

export default templates;
