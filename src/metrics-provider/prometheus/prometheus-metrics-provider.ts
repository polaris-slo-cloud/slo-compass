import { PrometheusQueryData } from '@/polaris-templates/slo-template';
import { InstantVector, PrometheusConnectionOptions, PrometheusDriver } from 'prometheus-query';
import Slo, { SloTarget } from '@/workspace/slo/Slo';
import * as _ from 'lodash';
import { MetricQueryResult, MetricsProvider } from '@/metrics-provider/api';
import { ObjectKind } from '@polaris-sloc/core';

interface PrometheusConfig {
  endpoint: string;
}

//TODO: This is very Kubernetes specific. Make more general!!!
function getSloParameter(paramName: string, target: SloTarget): string {
  const sanitizedName = paramName.replace(/^\${/, '').replace(/}$/, '');
  switch (sanitizedName) {
    case 'targetGvk':
      return `${ObjectKind.stringify(target.deployment.connectionMetadata)}`;
    case 'targetNamespace':
      return target.deployment.connectionMetadata.namespace;
    case 'targetName':
      return target.deployment.connectionMetadata.name;
  }
}
function injectQueryParameters(
  queryData: PrometheusQueryData,
  target: SloTarget
): PrometheusQueryData {
  const query: PrometheusQueryData = _.cloneDeep(queryData);

  Object.entries(query.labelFilters).forEach(([label, value]) => {
    if (!value.startsWith('${') || !value.endsWith('}')) {
      return;
    }

    const newValue = getSloParameter(value, target);
    query.labelFilters[label] = newValue;
  });

  return query;
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
      const query = injectQueryParameters(metric.source.prometheusQuery, target);
      const value = await this.pollMetric<number>(query);
      result.push({
        metric: metric.source.displayName,
        value: value[0],
      });
    }
    return result;
  }

  private async pollMetric<T>(query: PrometheusQueryData): Promise<T[]> {
    const promQuery = new PrometheusDriver(this.prometheusConfig);
    const queryString = this.buildQuery(query);

    const { result } = await promQuery.instantQuery(queryString);
    return result.map((x: InstantVector) => x.value as T);
  }

  private buildQuery(query: PrometheusQueryData): string {
    const select = `${query.appName}_${query.metricName}`;
    const filters = Object.entries(query.labelFilters).map(
      ([label, value]) => `${label}='${value}'`
    );

    return `${select}{${filters.join(',')}}`;
  }
}
