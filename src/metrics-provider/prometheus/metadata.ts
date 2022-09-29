import { MetricsConnection } from '@/connections/storage';
import { IConfigureMetricsProvider } from '@/metrics-provider/providers';
import { PrometheusMetricsProvider } from '@/metrics-provider/prometheus/prometheus-metrics-provider';
import { MetricsProvider } from '@/metrics-provider/api';
import PrometheusConnectionSettings from './PrometheusConnectionSettings.vue';

const configure: IConfigureMetricsProvider = {
  name: 'Prometheus',
  connectionSettingsComponent: PrometheusConnectionSettings,
  createMetricsProvider: (connection: MetricsConnection): MetricsProvider =>
    new PrometheusMetricsProvider({ endpoint: connection.connectionSettings as string }),
};

export default configure;
