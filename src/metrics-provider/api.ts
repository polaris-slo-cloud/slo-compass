import Slo, { SloTarget } from '@/workspace/slo/Slo';
import { Ref, ref } from 'vue';
import { MetricsConnection } from '@/connections/storage';
import { getProvider } from '@/metrics-provider/providers';

export interface MetricQueryResult {
  metric: string;
  value: number;
}

export interface MetricsProvider {
  name: string;
  test(): Promise<boolean>;
  pollSloMetrics(slo: Slo, target: SloTarget): Promise<MetricQueryResult[]>;
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
}

const provider: Ref<MetricsProvider> = ref(new NotConnectedProvider());

function createMetricsProvider(connection: MetricsConnection): MetricsProvider {
  const providerConfig = getProvider(connection.metricsProvider);
  return providerConfig
    ? providerConfig.createMetricsProvider(connection)
    : new NotConnectedProvider();
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
    pollSloMetrics: (slo: Slo, target: SloTarget) => provider.value.pollSloMetrics(slo, target),
  };
}
