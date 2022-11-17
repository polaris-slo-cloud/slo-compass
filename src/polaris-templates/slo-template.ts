import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { PolarisController } from '@/workspace/PolarisComponent';
import { SloMetricTemplateId } from '@/polaris-templates/slo-metrics/metrics-template';
import { useTemplateStore } from '@/store/template';

export interface SloTemplateMetadata {
  sloMappingKind: string;
  sloMappingKindPlural: string;
  displayName: string;
  description?: string;
  controllerName: string;
  containerImage: string;
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
    metricTemplates: ['cost_efficiency_composed_metric'],
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
    metricTemplates: ['cpu_load_avg_10s_raw_metric'],
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
  const templateStore = useTemplateStore();
  const metricsControllers =
    template.metricTemplates
      .map(templateStore.getSloMetricTemplate)
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
