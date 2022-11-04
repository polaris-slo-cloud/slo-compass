import { useMetricsProvider } from '@/metrics-provider/api';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { OrchestratorWatchManager } from '@/orchestrator/watch-manager';
import { SloMappingWatchHandler, getSupportedSloMappingObjectKinds } from '@/workspace/slo/SloMappingWatchHandler';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';

export async function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const metricsProvider = useMetricsProvider();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const watchManager = new OrchestratorWatchManager(bookmarkManager);

  async function pollMetrics() {
    const result = [];
    for (const slo of sloStore.slos) {
      const target = targetStore.getSloTarget(slo.target);
      const metricValues = await metricsProvider.pollSloMetrics(slo, target);
      result.push(...metricValues.map((x) => ({ slo: slo.id, ...x })));
    }

    sloStore.updateSloMetrics(result);
  }
  const pollingInterval = setInterval(pollMetrics, pollingIntervalMs);
  await watchManager.configureWatchers(getSupportedSloMappingObjectKinds(), new SloMappingWatchHandler());

  return () => {
    clearInterval(pollingInterval);
    watchManager.stopWatchers(getSupportedSloMappingObjectKinds());
  };
}
