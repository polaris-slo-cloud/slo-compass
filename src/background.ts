import { useMetricsProvider } from '@/metrics-provider/api';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';

export function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const metricsProvider = useMetricsProvider();

  async function pollMetrics() {
    const result = [];
    for (const slo of sloStore.slos) {
      const target = targetStore.getSloTarget(slo.target);
      const metricValues = await metricsProvider.pollSloMetrics(slo, target);
      result.push(...metricValues.map((x) => ({ slo: slo.id, ...x })));
    }

    sloStore.updateSloMetrics(result);
  }
  setInterval(pollMetrics, pollingIntervalMs);
}
