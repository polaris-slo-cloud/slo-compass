import {
  ComposedMetricParams,
  ComposedMetricSource,
  ComposedMetricSourceFactory,
  MetricsSource,
  OrchestratorGateway,
} from '@polaris-sloc/core';
import {
  TotalCost,
  TotalCostMetric,
} from '@polaris-sloc/common-mappings';
import { TotalCostMetricSource } from './total-cost.metric-source';

/**
 * Factory for creating `TotalCostMetricSource` instances that supply metrics of type `TotalCostMetric`.
 */
export class TotalCostMetricSourceFactory
  implements
    ComposedMetricSourceFactory<TotalCostMetric, TotalCost>
{

  readonly metricType = TotalCostMetric.instance;

  readonly metricSourceName = `${TotalCostMetric.instance.metricTypeName}/kube-cost`;

  createSource(params: ComposedMetricParams, metricsSource: MetricsSource, orchestrator: OrchestratorGateway): ComposedMetricSource<TotalCost> {
    return new TotalCostMetricSource(params, metricsSource, orchestrator);
  }
}
