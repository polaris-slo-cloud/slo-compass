import { useMetricsProvider } from '@/metrics-provider/api';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { OrchestratorWatchManager } from '@/orchestrator/watch-manager';
import { SloMappingWatchHandler, toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { TemplatesWatchHandler } from '@/polaris-templates/TemplatesWatchHandler';
import { useTemplateStore } from '@/store/template';
import { ObjectKindWatchHandlerPair } from '@polaris-sloc/core';
import { useWorkspaceStore } from '@/store/workspace';

export async function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const workspaceStore = useWorkspaceStore();
  const metricsProvider = useMetricsProvider();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const watchManager = new OrchestratorWatchManager(bookmarkManager);
  const orchestratorApi = useOrchestratorApi();
  const templateStore = useTemplateStore();

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

  const sloMappingWatchHandler = new SloMappingWatchHandler();
  const watcherKindHandlerPairs: ObjectKindWatchHandlerPair[] = [
    { kind: orchestratorApi.crdObjectKind.value, handler: new TemplatesWatchHandler() },
    ...workspaceStore.deployedSloMappings.map((kind) => ({ kind, handler: sloMappingWatchHandler })),
  ];
  await watchManager.configureWatchers(watcherKindHandlerPairs);

  const unsubscribeFromTemplateStore = templateStore.$onAction(({ name, store, args, after, onError }) => {
    if (name === 'saveSloTemplateFromPolaris') {
      const watchedKinds = store.sloTemplates.map((x) => x.sloMappingKind);
      const newTemplateKind = args[0].sloMappingKind;
      if (!watchedKinds.includes(newTemplateKind)) {
        watchManager.startWatchers([toSloMappingObjectKind(newTemplateKind)], new SloMappingWatchHandler());
      }
    }
  });
  return () => {
    clearInterval(pollingInterval);
    watchManager.stopAllWatchers();
    unsubscribeFromTemplateStore();
  };
}
