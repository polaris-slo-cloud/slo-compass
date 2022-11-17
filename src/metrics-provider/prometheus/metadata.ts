import { MetricsConnection } from '@/connections/storage';
import { IConfigureMetricsProvider } from '@/metrics-provider/providers';
import { PrometheusMetricsProvider } from '@/metrics-provider/prometheus/prometheus-metrics-provider';
import { MetricsProvider } from '@/metrics-provider/api';
import PrometheusConnectionSettings from './PrometheusConnectionSettings.vue';
import { SloMetricSourceTemplate, SloMetricSourceType } from '@/polaris-templates/slo-metrics/metrics-template';

export interface PrometheusQuery {
  rawQuery?: string;
  queryData?: PrometheusQueryData;
}

export interface PrometheusQueryData {
  appName: string;
  metricName: string;
  labelFilters: Record<string, string>;
}

const metricNamePrefix = (metricType: SloMetricSourceType) =>
  metricType === SloMetricSourceType.Composed ? 'metrics_polaris_slo_cloud_github_io_v1_' : '';

const composedMetricSource: PrometheusQueryData = Object.freeze({
  appName: 'polaris_composed',
  labelFilters: {
    target_gvk: '${targetGvk}',
    target_namespace: '${targetNamespace}',
    target_name: '${targetName}',
  },
  metricName: '',
});
const rawMetricSource: PrometheusQueryData = Object.freeze({
  appName: 'container',
  labelFilters: { pod: '${targetName}' },
  metricName: '',
});

const configure: IConfigureMetricsProvider = {
  name: 'Prometheus',
  connectionSettingsComponent: PrometheusConnectionSettings,
  metricSourceTemplateKey: 'prometheus',
  createMetricsProvider: (connection: MetricsConnection): MetricsProvider =>
    new PrometheusMetricsProvider({ endpoint: connection.connectionSettings as string }),
  addProviderMetricsSource(template: SloMetricSourceTemplate, rawQueries?: Record<string, string>): void {
    if (rawQueries) {
      template[this.metricSourceTemplateKey] = { rawQuery: rawQueries[this.metricSourceTemplateKey] };
      return;
    }
    const baseTemplate = template.type === SloMetricSourceType.Composed ? composedMetricSource : rawMetricSource;
    template[this.metricSourceTemplateKey] = {
      queryData: {
        ...baseTemplate,
        metricName: `${metricNamePrefix(template.type)}${template.metricName}`,
      },
    };
  },
};

export default configure;
