import { PrometheusQueryData } from '@/metrics-provider/prometheus/metadata';
import { InstantVector, PrometheusConnectionOptions, PrometheusDriver, RangeVector } from 'prometheus-query';
import {
  MetricQueryResult,
  MetricRangeQueryResult,
  MetricsProvider,
  RangeQueryResultItem,
  TimestampedQueryResult,
} from '@/metrics-provider/api';
import { ObjectKind } from '@polaris-sloc/core';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { MetricsProviderQuery, SloMetricSourceTemplate } from '@/polaris-templates/slo-metrics/metrics-template';
import * as _ from 'lodash';

interface PrometheusConfig {
  endpoint: string;
}
interface PrometheusQueryRange {
  start: number;
  end: number;
  step: number;
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

  public async pollSloMetrics(sloMetrics: SloMetricSourceTemplate[], target: SloTarget): Promise<MetricQueryResult[]> {
    const result = [];
    for (const metric of sloMetrics) {
      const values = await this.pollMetric<number>(metric.providerQueries.prometheus, target);
      result.push({
        metricSourceId: metric.id,
        metric: metric.displayName,
        value: _.mean(values),
      });
    }
    return result;
  }

  public async pollSloMetricsHistory(
    sloMetrics: SloMetricSourceTemplate[],
    target: SloTarget
  ): Promise<MetricRangeQueryResult[]> {
    const result = [];

    const range = {
      // last 24h
      start: new Date().getTime() - 24 * 60 * 60 * 1000,
      end: new Date().getTime(),
      // every 30 minutes
      step: 30 * 60,
    };
    for (const metric of sloMetrics) {
      const values = await this.pollMetricRange<number>(metric.providerQueries.prometheus, target, range);
      result.push({
        metric: metric.displayName,
        resultType: metric.queryResultType,
        queryResult: values,
      });
    }

    return result;
  }

  private async pollMetric<T>(query: MetricsProviderQuery, target: SloTarget): Promise<T[]> {
    const promQuery = new PrometheusDriver(this.prometheusConfig);
    let queryString = query.rawQuery ?? this.buildQuery(query.queryData);
    queryString = injectQueryParameters(queryString, target);

    const { result } = await promQuery.instantQuery(queryString);
    return result.map((x: InstantVector) => x.value.value as T);
  }

  private async pollMetricRange<T>(
    query: MetricsProviderQuery,
    target: SloTarget,
    range: PrometheusQueryRange
  ): Promise<RangeQueryResultItem<T>[]> {
    const promQuery = new PrometheusDriver(this.prometheusConfig);
    let queryString = query.rawQuery ?? this.buildQuery(query.queryData);
    queryString = injectQueryParameters(queryString, target);

    const { result } = await promQuery.rangeQuery(queryString, range.start, range.end, range.step);
    return result.map((x: RangeVector) => ({
      values: x.values.map<TimestampedQueryResult<T>>(({ time, value }) => ({ timestamp: time, value: value as T })),
      target: x.metric.labels['pod'] as string,
    }));
  }

  private buildQuery(query: PrometheusQueryData): string {
    const select = `${query.appName}_${query.metricName}`;
    const filters = Object.entries(query.labelFilters).map(([label, value]) => `${label}='${value}'`);

    return `${select}{${filters.join(',')}}`;
  }
}
