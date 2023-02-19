import {
  ComposedMetricSourceBase, Duration, LabelFilters, LabelGrouping,
  MetricsSource, MetricUnavailableError,
  OrchestratorGateway,
  Sample, TimeRange, TimeSeriesInstant
} from "@polaris-sloc/core";
import {
  CostEfficiency,
  CostEfficiencyParams, TotalCost, TotalCostMetric
} from "@polaris-sloc/common-mappings";
import { Observable } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';

interface RequestsFasterThanThresholdInfo {

  /** The percentile of requests that are faster than the threshold. */
  percentileFaster: number;

  /** The absolute number of requests that are faster than the threshold. */
  totalReqFaster: number

}

/**
 * Computes the `CostEfficiency` composed metric.
 * This is an adaptation of the Polaris RestApiCostEfficiencyMetricSource:
 * https://github.com/polaris-slo-cloud/polaris/blob/master/ts/libs/cost-efficiency/src/lib/metrics/rest-api-cost-efficiency/rest-api-cost-efficiency-metric-source.ts
 */
export class CostEfficiencyMetricSource extends ComposedMetricSourceBase<CostEfficiency> {

  private targetThresholdSecStr: string;

  constructor(
    private params: CostEfficiencyParams,
    metricsSource: MetricsSource,
    orchestrator: OrchestratorGateway
  ) {
    super(metricsSource, orchestrator);
    this.targetThresholdSecStr = (params.targetThreshold / 1000).toString();
  }
  getValueStream(): Observable<Sample<CostEfficiency>> {
    const { targetThreshold, ...costParams } = this.params;
    const costSource = this.metricsSource.getComposedMetricSource(TotalCostMetric.instance, costParams);

    return this.getDefaultPollingInterval().pipe(
      switchMap(() => this.getPercentileFasterThanThreshold()),
      withLatestFrom(costSource.getValueStream()),
      // For some reason the TypeScript compiler reports a TS2345 if we don't declare the types of the tuple's members
      // even though the TS language server in VS Code reports that everything is fine.
      map(([ reqFasterThan, totalCost ]: [ RequestsFasterThanThresholdInfo, Sample<TotalCost> ]) => ({
        value: this.computeCostEfficiency(reqFasterThan, totalCost.value),
        timestamp: new Date().valueOf(),
      })),
    );
  }

  private computeCostEfficiency(reqFasterThan: RequestsFasterThanThresholdInfo, totalCost: TotalCost): CostEfficiency {
    return {
      costEfficiency: reqFasterThan.totalReqFaster / totalCost.currentCostPerHour,
      percentileBetterThanThreshold: reqFasterThan.percentileFaster,
      totalCost,
    };
  }

  private async getPercentileFasterThanThreshold(): Promise<RequestsFasterThanThresholdInfo> {
    const fasterThanBucketQuery = this.metricsSource.getTimeSeriesSource()
      .select<number>('http', 'request_duration_seconds_bucket', TimeRange.fromDuration(Duration.fromMinutes(1)))
      //TODO: Check if that is really the pod label
      .filterOnLabel(LabelFilters.regex('pod', `${this.params.sloTarget.name}.*`))
      .filterOnLabel(LabelFilters.equal('le', this.targetThresholdSecStr))
      .rate()
      .sumByGroup(LabelGrouping.by('path'));

    const reqCountQuery = this.metricsSource.getTimeSeriesSource()
      .select<number>('http', 'request_duration_seconds_count', TimeRange.fromDuration(Duration.fromMinutes(1)))
      //TODO: Check if that is really the pod label
      .filterOnLabel(LabelFilters.regex('pod', `${this.params.sloTarget.name}.*`))
      .rate()
      .sumByGroup(LabelGrouping.by('path'));

    const [ fasterThanBucketResult, reqCountResult ] = await Promise.all([ fasterThanBucketQuery.execute(), reqCountQuery.execute() ]);

    if (!fasterThanBucketResult.results || fasterThanBucketResult.results.length === 0) {
      throw new MetricUnavailableError('request_duration_seconds_bucket', fasterThanBucketQuery);
    }
    if (!reqCountResult.results || reqCountResult.results.length === 0) {
      throw new MetricUnavailableError('request_duration_seconds_count', reqCountQuery);
    }

    const totalReqFasterThanThreshold = this.sumResults(fasterThanBucketResult.results);
    const totalReqCount = this.sumResults(reqCountResult.results);

    if (totalReqCount === 0) {
      return {
        percentileFaster: 1,
        totalReqFaster: 0,
      };
    }
    return {
      percentileFaster: totalReqFasterThanThreshold / totalReqCount,
      totalReqFaster: totalReqFasterThanThreshold,
    };
  }

  private sumResults(results: TimeSeriesInstant<number>[]): number {
    let sum = 0;
    results.forEach(result => sum += result.samples[0].value);
    return sum;
  }
}
