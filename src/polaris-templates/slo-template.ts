import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { PolarisController } from '@/workspace/PolarisComponent';

export interface SloTemplateMetadata {
  sloMappingKind: string;
  sloMappingKindPlural: string;
  displayName: string;
  description?: string;
  controllerName: string;
  containerImage: string;
  config: ConfigParameter[];
  metrics: SloMetricSource[];
  confirmed: boolean;
}

export interface PrometheusQueryData {
  appName: string;
  metricName: string;
  labelFilters: Record<string, string>;
}

export interface SloMetricSource {
  displayName: string;
  metricsController?: ComposedMetricSource;
  prometheusQuery: PrometheusQueryData;
}

export interface ComposedMetricSource {
  controllerName: string;
  containerImage: string;
  composedMetricResources: string;
}

export const templates: SloTemplateMetadata[] = [
  {
    sloMappingKind: 'CostEfficiencySloMapping',
    sloMappingKindPlural: 'costefficiencyslomappings',
    displayName: 'Cost Efficiency',
    description: 'This SLO calculates a cost efficiency using the response time and cost of the target',
    controllerName: 'cost-efficiency-slo-controller',
    containerImage: 'polarissloc/slo-cost-efficiency:latest',
    config: [
      {
        parameter: 'responseTimeThresholdMs',
        displayName: 'Response Time Threshold (in ms)',
        type: ParameterType.Integer,
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
    metrics: [
      {
        displayName: 'Cost Efficiency',
        metricsController: {
          controllerName: 'metrics-rest-api-cost-efficiency-controller',
          containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
          composedMetricResources: 'costefficiencymetricmappings',
        },
        prometheusQuery: {
          appName: 'polaris_composed',
          metricName: 'metrics_polaris_slo_cloud_github_io_v1_cost_efficiency',
          labelFilters: {
            target_gvk: '${targetGvk}',
            target_namespace: '${targetNamespace}',
            target_name: '${targetName}',
          },
        },
      },
    ],
    confirmed: true,
  },
  {
    sloMappingKind: 'CPUUsageSloMapping',
    sloMappingKindPlural: 'cpuusageslomappings',
    displayName: 'CPU Usage',
    description: 'This SLO utilizes the CPU usage metrics to calculate its compliance',
    controllerName: 'cpu-usage-slo-controller',
    containerImage: 'polarissloc/slo-cpu-usage:latest',
    config: [
      {
        parameter: 'targetAvgCPUUtilizationPercentage',
        displayName: 'Average CPU Utilization Target',
        type: ParameterType.Decimal,
        required: true,
      },
    ],
    metrics: [
      {
        displayName: 'CPU Load Avg 10s',
        prometheusQuery: {
          appName: 'container',
          metricName: 'cpu_load_average_10s',
          labelFilters: { pod: '${targetName}' },
        },
      },
    ],
    confirmed: true,
  },
];

//TODO: Refactor for custom templates
export function getPolarisControllers(template: SloTemplateMetadata): PolarisController[] {
  const result = [];
  if (template.containerImage && template.controllerName) {
    result.push({
      type: 'SLO Controller',
      name: template.controllerName,
      deployment: null,
    });
  }
  const metricsControllers =
    template.metrics
      .filter((x) => !!x.metricsController)
      .map(
        (x): PolarisController => ({
          type: 'Metrics Controller',
          name: x.metricsController.controllerName,
          deployment: null,
        })
      ) ?? [];
  result.push(...metricsControllers);

  return result;
}
