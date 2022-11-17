export enum SloMetricSourceType {
  Composed = 'Composed Metric',
  Raw = 'Raw Metric',
}

export interface ComposedMetricSource {
  controllerName: string;
  containerImage: string;
  composedMetricResources: string;
}

export enum MetricQueryResultValueType {
  Integer = 'Integer',
  Decimal = 'Decimal',
  Percentage = 'Percentage',
}
export interface MetricQueryResultType {
  type: MetricQueryResultValueType;
  unit: string;
}

export type SloMetricTemplateId = string;
export interface SloMetricSourceTemplate {
  id: SloMetricTemplateId;
  displayName: string;
  type: SloMetricSourceType;
  metricName?: string;
  metricsController?: ComposedMetricSource;
  queryResultType: MetricQueryResultType;
  //used to hold provider specific metric query information
  [provider: string]: any;
}

export const templates: SloMetricSourceTemplate[] = [
  {
    id: 'cost_efficiency_composed_metric',
    displayName: 'Cost Efficiency',
    type: SloMetricSourceType.Composed,
    metricName: 'cost_efficiency',
    metricsController: {
      controllerName: 'metrics-rest-api-cost-efficiency-controller',
      containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
      composedMetricResources: 'costefficiencymetricmappings',
    },
    queryResultType: {
      type: MetricQueryResultValueType.Percentage,
      unit: '%',
    },
    prometheus: {
      queryData: {
        appName: 'polaris_composed',
        metricName: 'metrics_polaris_slo_cloud_github_io_v1_cost_efficiency',
        labelFilters: {
          target_gvk: '${targetGvk}',
          target_namespace: '${targetNamespace}',
          target_name: '${targetName}',
        },
      },
    },
  },
  {
    id: 'cpu_load_avg_10s_raw_metric',
    displayName: 'CPU Load Avg 10s',
    type: SloMetricSourceType.Raw,
    metricName: 'cpu_load_average_10s',
    queryResultType: {
      type: MetricQueryResultValueType.Percentage,
      unit: '%',
    },
    prometheus: {
      queryData: {
        appName: 'container',
        metricName: 'cpu_load_average_10s',
        labelFilters: {pod: '${targetName}'},
      },
    },
  },
];
