import { watch } from 'vue';
import { ObjectKindWatchHandlerPair } from '@polaris-sloc/core';
import { useMetricsProvider } from '@/metrics-provider/api';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useTemplateStore } from '@/store/template';
import { OrchestratorWatchManager } from '@/orchestrator/watch-manager';
import { SloMappingWatchHandler } from '@/workspace/slo/SloMappingWatchHandler';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { TemplatesWatchHandler } from '@/polaris-templates/TemplatesWatchHandler';
import { SloEvaluationWatchHandler } from '@/workspace/slo/SloEvaluationWatchHandler';

export async function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const metricsProvider = useMetricsProvider();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const watchManager = new OrchestratorWatchManager(bookmarkManager);
  const orchestratorApi = useOrchestratorApi();
  const polarisComponentStore = usePolarisComponentStore();
  const templateStore = useTemplateStore();

  async function pollMetrics() {
    const result = [];
    for (const slo of sloStore.slos) {
      const target = targetStore.getSloTarget(slo.target);
      const sloMetrics = slo.metrics.map((x) => templateStore.getSloMetricTemplate(x.source));
      const metricValues = await metricsProvider.pollSloMetrics(sloMetrics, target);
      result.push(...metricValues.map((x) => ({ slo: slo.id, ...x })));
    }

    sloStore.updateSloMetrics(result);
  }
  const pollingInterval = setInterval(pollMetrics, pollingIntervalMs);

  const sloMappingWatchHandler = new SloMappingWatchHandler();
  const sloEvaluationWatchHandler = new SloEvaluationWatchHandler();
  const watcherKindHandlerPairs: ObjectKindWatchHandlerPair[] = [
    { kind: orchestratorApi.crdObjectKind.value, handler: new TemplatesWatchHandler() },
    ...polarisComponentStore.deployedSloMappings.map((kind) => ({ kind, handler: sloMappingWatchHandler })),
    ...polarisComponentStore.deployedElasticityStrategyCrds.map((kind) => ({
      kind,
      handler: sloEvaluationWatchHandler,
    })),
  ];
  await watchManager.configureWatchers(watcherKindHandlerPairs);

  const unsubscribeFromDeployedSloMappingKindsWatch = watch(
    () => polarisComponentStore.deployedSloMappings,
    (value, oldValue) => {
      watchManager.stopWatchers(oldValue);
      watchManager.startWatchers(value, new SloMappingWatchHandler());
    },
    { deep: true }
  );
  const unsubscribeFromDeployedElasticityStrategyCrdsWatch = watch(
    () => polarisComponentStore.deployedElasticityStrategyCrds,
    (value, oldValue) => {
      watchManager.stopWatchers(oldValue);
      watchManager.startWatchers(value, new SloEvaluationWatchHandler());
    },
    { deep: true }
  );
  return () => {
    clearInterval(pollingInterval);
    watchManager.stopAllWatchers();
    unsubscribeFromDeployedSloMappingKindsWatch();
    unsubscribeFromDeployedElasticityStrategyCrdsWatch();
  };
}
