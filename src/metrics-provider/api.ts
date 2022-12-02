import { Ref, ref } from 'vue';
import { MetricsConnection } from '@/connections/storage';
import { getProvider } from '@/metrics-provider/providers';
import { SloTarget } from '@/workspace/targets/SloTarget';
import {
  MetricQueryResultType,
  SloMetricSourceTemplate,
  SloMetricTemplateId,
} from '@/polaris-templates/slo-metrics/metrics-template';

export interface MetricQueryResult {
  metricSourceId: SloMetricTemplateId;
  metric: string;
  value: number;
}

export interface TimestampedQueryResult<T> {
  timestamp: Date;
  value: T;
}

export interface RangeQueryResultItem<T> {
  target: string;
  values: TimestampedQueryResult<T>[];
}

export interface MetricRangeQueryResult {
  metric: string;
  resultType: MetricQueryResultType;
  queryResult: RangeQueryResultItem<number>;
}

export interface MetricsProvider {
  name: string;
  test(): Promise<boolean>;
  pollSloMetrics(sloMetrics: SloMetricSourceTemplate[], target: SloTarget): Promise<MetricQueryResult[]>;
  pollSloMetricsHistory(sloMetrics: SloMetricSourceTemplate[], target: SloTarget): Promise<MetricRangeQueryResult[]>;
}

export interface MetricsProviderApi extends MetricsProvider {
  connect(connection: MetricsConnection): void;
  testConnection(connection: MetricsConnection): Promise<boolean>;
}

class NotConnectedProvider implements MetricsProvider {
  public name = 'No Metrics Provider';
  public test(): Promise<boolean> {
    return Promise.resolve(false);
  }
  public pollSloMetrics(): Promise<MetricQueryResult[]> {
    return Promise.resolve([]);
  }
  public pollSloMetricsHistory(): Promise<MetricRangeQueryResult[]> {
    return Promise.resolve([]);
  }
}

const provider: Ref<MetricsProvider> = ref(new NotConnectedProvider());

function createMetricsProvider(connection: MetricsConnection): MetricsProvider {
  const providerConfig = getProvider(connection.metricsProvider);
  return providerConfig ? providerConfig.createMetricsProvider(connection) : new NotConnectedProvider();
}

function connect(connection: MetricsConnection): void {
  provider.value = createMetricsProvider(connection);
}
async function testConnection(connection: MetricsConnection): Promise<boolean> {
  const providerConnection = createMetricsProvider(connection);
  return await providerConnection.test();
}
export function useMetricsProvider(): MetricsProviderApi {
  return {
    name: provider.value.name,
    connect,
    testConnection,
    test: () => provider.value.test(),
    pollSloMetrics: (sloMetrics: SloMetricSourceTemplate[], target: SloTarget) =>
      provider.value.pollSloMetrics(sloMetrics, target),
    pollSloMetricsHistory: (sloMetrics: SloMetricSourceTemplate[], target: SloTarget) =>
      provider.value.pollSloMetricsHistory(sloMetrics, target),
  };
}
