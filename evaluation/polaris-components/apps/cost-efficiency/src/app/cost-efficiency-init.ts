import { PolarisRuntime } from '@polaris-sloc/core';
import { TotalCostMetricSourceFactory , CostEfficiencyMetricSourceFactory } from './metrics';

/**
 * Initializes the CostEfficiency metrics and registers them with the `PolarisRuntime`.
 *
 * @param runtime The `PolarisRuntime` instance.
 */
export function initCostEfficiencyMetrics(runtime: PolarisRuntime): void {
  runtime.metricsSourcesManager.addComposedMetricSourceFactory(new TotalCostMetricSourceFactory());

  const restApiCostEffFactory = new CostEfficiencyMetricSourceFactory();
  CostEfficiencyMetricSourceFactory.supportedSloTargetTypes.forEach(
          sloTargetType => runtime.metricsSourcesManager.addComposedMetricSourceFactory(restApiCostEffFactory, sloTargetType),
          );
}