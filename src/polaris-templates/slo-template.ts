import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { SloMetricTemplateId } from '@/polaris-templates/slo-metrics/metrics-template';
import { PolarisControllerDeploymentMetadata } from '@/workspace/PolarisComponent';

export interface SloTemplateMetadata {
  sloMappingKind: string;
  sloMappingKindPlural: string;
  displayName: string;
  description?: string;
  sloController?: PolarisControllerDeploymentMetadata;
  config: ConfigParameter[];
  metricTemplates: SloMetricTemplateId[];
  confirmed: boolean;
}

export const templates: SloTemplateMetadata[] = [
  {
    sloMappingKind: 'CostEfficiencySloMapping',
    sloMappingKindPlural: 'costefficiencyslomappings',
    displayName: 'Cost Efficiency',
    description: 'This SLO calculates a cost efficiency using the response time and cost of the target',
    sloController: {
      name: 'cost-efficiency-slo-controller',
      containerImage: 'polarissloc/slo-cost-efficiency:latest',
    },
    config: [
      {
        parameter: 'responseTimeThresholdMs',
        displayName: 'Response Time Threshold (in ms)',
        type: ParameterType.Integer,
        valueOptions: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        required: true,
      },
      {
        parameter: 'targetCostEfficiency',
        displayName: 'Cost Efficiency Target',
        type: ParameterType.Decimal,
        required: true,
      },
      {
        parameter: 'minRequestsPercentile',
        displayName: 'Minimum Requests Percentile',
        type: ParameterType.Percentage,
        required: false,
      },
    ],
    metricTemplates: [
      'cost_efficiency_composed_metric',
      'cost_efficiency_total_cost_per_hour_metric',
      'cost_efficiency_percentile_better_than_threshold_metric',
    ],
    confirmed: true,
  },
  {
    sloMappingKind: 'CPUUsageSloMapping',
    sloMappingKindPlural: 'cpuusageslomappings',
    displayName: 'CPU Usage',
    description: 'This SLO utilizes the CPU usage metrics to calculate its compliance',
    sloController: {
      name: 'cpu-usage-slo-controller',
      containerImage: 'polarissloc/slo-cpu-usage:latest',
    },
    config: [
      {
        parameter: 'targetAvgCPUUtilizationPercentage',
        displayName: 'Average CPU Utilization Target',
        type: ParameterType.Decimal,
        required: true,
      },
    ],
    metricTemplates: ['cpu_load_avg_10s_raw_metric'],
    confirmed: true,
  },
];
