import { useMetricsProvider } from '@/metrics-provider/api';
import { useWorkspaceStore } from '@/store';

export function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const store = useWorkspaceStore();
  const metricsProvider = useMetricsProvider();

  async function pollMetrics() {
    const result = [];
    for (const slo of store.workspace.slos) {
      const target = store.getSloTarget(slo.target);
      const metricValues = await metricsProvider.pollSloMetrics(slo, target);
      result.push(...metricValues.map((x) => ({ slo: slo.id, ...x })));
    }

    store.updateSloMetrics(result);
  }
  setInterval(pollMetrics, pollingIntervalMs);
}
