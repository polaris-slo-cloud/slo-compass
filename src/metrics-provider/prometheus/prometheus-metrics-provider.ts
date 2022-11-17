import { PrometheusQuery, PrometheusQueryData } from '@/metrics-provider/prometheus/metadata';
import { InstantVector, PrometheusConnectionOptions, PrometheusDriver } from 'prometheus-query';
import Slo from '@/workspace/slo/Slo';
import { MetricQueryResult, MetricsProvider } from '@/metrics-provider/api';
import { ObjectKind } from '@polaris-sloc/core';
import { SloTarget } from '@/workspace/targets/SloTarget';

interface PrometheusConfig {
  endpoint: string;
}

const sloParameterMap: Record<string, (target: SloTarget) => string> = {
  targetGvk: (target) => ObjectKind.stringify(target.deployment.connectionMetadata),
  targetNamespace: (target) => target.deployment.connectionMetadata.namespace,
  targetName: (target) => target.deployment.connectionMetadata.name,
};

//TODO: This is very Kubernetes specific. Make more general!!!
function injectQueryParameters(query: string, target: SloTarget): string {
  let interpolated = query;
  for (const [parameter, getTargetValue] of Object.entries(sloParameterMap)) {
    interpolated = interpolated.replace('${' + parameter + '}', getTargetValue(target));
  }
  return interpolated;
}

export class PrometheusMetricsProvider implements MetricsProvider {
  public name = 'Prometheus';
  private readonly prometheusConfig: PrometheusConnectionOptions;

  constructor(config: PrometheusConfig) {
    this.prometheusConfig = this.buildPrometheusConfig(config);
  }

  public async test(): Promise<boolean> {
    const promQuery = new PrometheusDriver(this.prometheusConfig);
    try {
      await promQuery.status();
      return true;
    } catch (e) {
      return false;
    }
  }

  private buildPrometheusConfig(config: PrometheusConfig): PrometheusConnectionOptions {
    const { endpoint } = config;

    return {
      endpoint,
    };
  }

  public async pollSloMetrics(slo: Slo, target: SloTarget): Promise<MetricQueryResult[]> {
    const result = [];
    for (const metric of slo.metrics) {
      const value = await this.pollMetric<number>(metric.source.prometheus, target);
      result.push({
        metric: metric.source.displayName,
        value: value[0],
      });
    }
    return result;
  }

  private async pollMetric<T>(query: PrometheusQuery, target: SloTarget): Promise<T[]> {
    const promQuery = new PrometheusDriver(this.prometheusConfig);
    let queryString = query.rawQuery ?? this.buildQuery(query.queryData);
    queryString = injectQueryParameters(queryString, target);

    const { result } = await promQuery.instantQuery(queryString);
    return result.map((x: InstantVector) => x.value.value as T);
  }

  private buildQuery(query: PrometheusQueryData): string {
    const select = `${query.appName}_${query.metricName}`;
    const filters = Object.entries(query.labelFilters).map(([label, value]) => `${label}='${value}'`);

    return `${select}{${filters.join(',')}}`;
  }
}
