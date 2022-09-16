import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { PolarisController } from '@/workspace/PolarisComponent';

export interface SloTemplateMetadata {
  key: string;
  name: string;
  description?: string;
  controllerName: string;
  containerImage: string;
  sloMappingTypeApiGroup: string;
  sloMappingResources: string;
  sloMappingKind: string;
  config: ConfigParameter[];
  metrics?: SloMetricSource[];
}

export interface SloMetricSource {
  controllerName: string;
  containerImage: string;
  composedMetricResources: string;
}

export const templates: SloTemplateMetadata[] = [
  {
    key: 'costEfficiencySlo',
    name: 'Cost Efficiency',
    description:
      'This SLO calculates a cost efficiency using the response time and cost of the target',
    controllerName: 'cost-efficiency-slo-controller',
    containerImage: 'polarissloc/slo-cost-efficiency:latest',
    sloMappingTypeApiGroup: 'slo.polaris-slo-cloud.github.io',
    sloMappingResources: 'costefficiencyslomappings',
    sloMappingKind: 'CostEfficiencySloMapping',
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
        type: ParameterType.Percentage,
        optional: true,
      },
    ],
    metrics: [
      {
        controllerName: 'metrics-rest-api-cost-efficiency-controller',
        containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
        composedMetricResources: 'costefficiencymetricmappings',
      },
    ],
  },
  {
    key: 'cpuUsageSlo',
    name: 'CPU Usage',
    description: 'This SLO utilizes the CPU usage metrics to calculate its compliance',
    controllerName: 'cpu-usage-slo-controller',
    containerImage: 'polarissloc/slo-cpu-usage:latest',
    sloMappingTypeApiGroup: 'slo.polaris-slo-cloud.github.io',
    sloMappingResources: 'cpuusageslomappings',
    sloMappingKind: 'CpuUsageSloMapping',
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

export function getTemplate(key: string): SloTemplateMetadata {
  return templates.find((x) => x.key === key);
}

export function getPolarisControllers(template: SloTemplateMetadata): PolarisController[] {
  const metricsControllers =
    template.metrics?.map(
      (x): PolarisController => ({
        type: 'Metrics Controller',
        name: x.controllerName,
        deployment: null,
      })
    ) ?? [];

  return [
    {
      type: 'SLO Controller',
      name: template.controllerName,
      deployment: null,
    },
    ...metricsControllers,
  ];
}
