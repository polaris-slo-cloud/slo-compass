export enum SloMetricSourceType {
  Composed = 'Composed Metric',
  Raw = 'Raw Metric',
}

export interface ComposedMetricSource {
  controllerName: string;
  containerImage: string;
  composedMetricKind: string;
  composedMetricKindPlural: string;
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

export interface MetricsProviderQuery {
  rawQuery?: string;
  queryData?: any;
}

export type SloMetricTemplateId = string;
export interface SloMetricSourceTemplate {
  id: SloMetricTemplateId;
  displayName: string;
  description?: string;
  type: SloMetricSourceType;
  metricName?: string;
  metricsController?: ComposedMetricSource;
  queryResultType: MetricQueryResultType;
  isSimpleQuery: boolean;
  labelFilters?: Record<string, string>;
  providerQueries: Record<string, MetricsProviderQuery>;
}

export const templates: SloMetricSourceTemplate[] = [
  {
    id: 'cost_efficiency_composed_metric',
    displayName: 'Cost Efficiency',
    description:
      'The cost efficiency of a REST service is calculated as: (number of requests per second served faster than a configured threshold) divided by (total cost of the service).',
    type: SloMetricSourceType.Composed,
    metricName: 'cost_efficiency',
    metricsController: {
      controllerName: 'metrics-rest-api-cost-efficiency-controller',
      containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
      composedMetricKind: 'CostEfficiencyMetricMapping',
      composedMetricKindPlural: 'costefficiencymetricmappings',
    },
    queryResultType: {
      type: MetricQueryResultValueType.Percentage,
      unit: '%',
    },
    isSimpleQuery: true,
    labelFilters: {
      metric_prop_key: 'costEfficiency',
    },
    providerQueries: {
      prometheus: {
        queryData: {
          appName: 'polaris_composed',
          metricName: 'metrics_polaris_slo_cloud_github_io_v1_cost_efficiency',
          labelFilters: {
            target_gvk: '${targetGvk}',
            target_namespace: '${targetNamespace}',
            target_name: '${targetName}',
            metric_prop_key: 'costEfficiency',
          },
        },
      },
    },
  },
  {
    id: 'cost_efficiency_total_cost_per_hour_metric',
    displayName: 'Cost per Hour',
    description: 'The total cost of the service per hour.',
    type: SloMetricSourceType.Composed,
    metricName: 'cost_efficiency',
    metricsController: {
      controllerName: 'metrics-rest-api-cost-efficiency-controller',
      containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
      composedMetricKind: 'CostEfficiencyMetricMapping',
      composedMetricKindPlural: 'costefficiencymetricmappings',
    },
    queryResultType: {
      type: MetricQueryResultValueType.Decimal,
      unit: '€',
    },
    isSimpleQuery: true,
    labelFilters: {
      metric_prop_key: 'totalCost.currentCostPerHour',
    },
    providerQueries: {
      prometheus: {
        queryData: {
          appName: 'polaris_composed',
          metricName: 'metrics_polaris_slo_cloud_github_io_v1_cost_efficiency',
          labelFilters: {
            target_gvk: '${targetGvk}',
            target_namespace: '${targetNamespace}',
            target_name: '${targetName}',
            metric_prop_key: 'totalCost.currentCostPerHour',
          },
        },
      },
    },
  },
  {
    id: 'cost_efficiency_percentile_better_than_threshold_metric',
    displayName: 'Requests better than Threshold',
    description: 'The percentage of requests that were better than the defined threshold',
    type: SloMetricSourceType.Composed,
    metricName: 'cost_efficiency',
    metricsController: {
      controllerName: 'metrics-rest-api-cost-efficiency-controller',
      containerImage: 'polarissloc/metrics-rest-api-cost-efficiency-controller:latest',
      composedMetricKind: 'CostEfficiencyMetricMapping',
      composedMetricKindPlural: 'costefficiencymetricmappings',
    },
    queryResultType: {
      type: MetricQueryResultValueType.Percentage,
      unit: '%',
    },
    isSimpleQuery: true,
    labelFilters: {
      metric_prop_key: 'percentileBetterThanThreshold',
    },
    providerQueries: {
      prometheus: {
        queryData: {
          appName: 'polaris_composed',
          metricName: 'metrics_polaris_slo_cloud_github_io_v1_cost_efficiency',
          labelFilters: {
            target_gvk: '${targetGvk}',
            target_namespace: '${targetNamespace}',
            target_name: '${targetName}',
            metric_prop_key: 'percentileBetterThanThreshold',
          },
        },
      },
    },
  },
  {
    id: 'cpu_load_avg_10s_raw_metric',
    displayName: 'CPU Load Avg 10s',
    description: 'Describes the average CPU load percentage over a measurement span of 10 seconds.',
    type: SloMetricSourceType.Raw,
    metricName: 'cpu_load_average_10s',
    queryResultType: {
      type: MetricQueryResultValueType.Percentage,
      unit: '%',
    },
    isSimpleQuery: true,
    providerQueries: {
      prometheus: {
        queryData: {
          appName: 'container',
          metricName: 'cpu_load_average_10s',
          labelFilters: { pod: '${targetName}' },
        },
      },
    },
  },
];
