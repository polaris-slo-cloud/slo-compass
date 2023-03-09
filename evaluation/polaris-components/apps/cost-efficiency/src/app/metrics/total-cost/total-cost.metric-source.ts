import { TotalCost } from '@polaris-sloc/common-mappings';
import {
  ComposedMetricParams,
  ComposedMetricSourceBase,
  LabelFilters,
  LabelGrouping,
  MetricUnavailableError,
  MetricsSource,
  OrchestratorGateway,
  Sample,
} from '@polaris-sloc/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

const MEMORY_HOURLY_COST = 0.07;
const CPU_HOURLY_COST = 3.28;

/**
* Provides the total cost of a `SloTarget` using KubeCost.
*/
export class TotalCostMetricSource extends ComposedMetricSourceBase<TotalCost> {

  constructor(private params: ComposedMetricParams, metricsSource: MetricsSource, orchestrator: OrchestratorGateway) {
    super(metricsSource, orchestrator);
  }

  getValueStream(): Observable<Sample<TotalCost>> {
    return this.getDefaultPollingInterval().pipe(
            switchMap(() => this.getCost()),
            map(totalCost => ({
              value: totalCost,
              timestamp: new Date().valueOf(),
            })),
            );
  }

  private async getCost(): Promise<TotalCost> {

    const memoryCostQuery = this.metricsSource.getTimeSeriesSource()
            .select<number>('container', 'memory_working_set_bytes')
            .filterOnLabel(LabelFilters.equal('namespace', this.params.namespace))
            .divideBy(1024)
            .divideBy(1024)
            .divideBy(1024)
            .multiplyBy(MEMORY_HOURLY_COST)
            .sumByGroup(LabelGrouping.by('pod'));

    const cpuCostQuery = this.metricsSource.getTimeSeriesSource()
            .select<number>('node', 'namespace_pod_container:container_cpu_usage_seconds_total:sum_irate')
            .filterOnLabel(LabelFilters.equal('namespace', this.params.namespace))
            .multiplyBy(CPU_HOURLY_COST)
            .sumByGroup(LabelGrouping.by('pod'));

    const totalCostQuery = memoryCostQuery.add(cpuCostQuery)
            .sumByGroup();

    const totalCost = await totalCostQuery.execute();

    if (!totalCost.results || totalCost.results.length === 0) {
      throw new MetricUnavailableError('total cost');
    }

    return {
      currentCostPerHour: totalCost.results[0].samples[0].value,
      accumulatedCostInPeriod: totalCost.results[0].samples[0].value,
    };
  }

}
