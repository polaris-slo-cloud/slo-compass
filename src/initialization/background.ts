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
import { CONNECTED_EVENT, IOrchestratorApiConnection, useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { TemplatesWatchHandler } from '@/polaris-templates/TemplatesWatchHandler';
import { SloEvaluationWatchHandler } from '@/workspace/slo/SloEvaluationWatchHandler';
import { PolarisControllersWatchHandler } from '@/polaris-components/PolarisControllersWatchHandler';

async function setupMetricPolling(): Promise<NodeJS.Timer> {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const metricsProvider = useMetricsProvider();
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
  return setInterval(pollMetrics, pollingIntervalMs);
}

async function setupOrchestratorWatches(orchestratorApi: IOrchestratorApiConnection) {
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const watchManager = new OrchestratorWatchManager(bookmarkManager);
  const polarisComponentStore = usePolarisComponentStore();

  const sloMappingWatchHandler = new SloMappingWatchHandler(bookmarkManager);
  const sloEvaluationWatchHandler = new SloEvaluationWatchHandler(bookmarkManager);
  const watcherKindHandlerPairs: ObjectKindWatchHandlerPair[] = [
    { kind: orchestratorApi.crdObjectKind.value, handler: new TemplatesWatchHandler(bookmarkManager) },
    { kind: orchestratorApi.deploymentObjectKind.value, handler: new PolarisControllersWatchHandler(bookmarkManager) },
  ];
  // First load all templates
  await watchManager.startWatchers(watcherKindHandlerPairs);

  // Afterwards we load the mappings that depend on the templates
  await watchManager.startWatchers([
    ...polarisComponentStore.deployedSloMappings.map((kind) => ({
      kind,
      handler: sloMappingWatchHandler,
    })),
    ...polarisComponentStore.deployedElasticityStrategyCrds.map((kind) => ({
      kind,
      handler: sloEvaluationWatchHandler,
    })),
  ]);
  const unsubscribeFromDeployedSloMappingKindsWatch = watch(
    () => polarisComponentStore.deployedSloMappings,
    (value, oldValue) => {
      watchManager.stopWatchers(oldValue);
      watchManager.startWatchers(value, new SloMappingWatchHandler(bookmarkManager));
    },
    { deep: true }
  );
  const unsubscribeFromDeployedElasticityStrategyCrdsWatch = watch(
    () => polarisComponentStore.deployedElasticityStrategyCrds,
    (value, oldValue) => {
      watchManager.stopWatchers(oldValue);
      watchManager.startWatchers(value, new SloEvaluationWatchHandler(bookmarkManager));
    },
    { deep: true }
  );

  return () => {
    watchManager.stopAllWatchers();
    unsubscribeFromDeployedSloMappingKindsWatch();
    unsubscribeFromDeployedElasticityStrategyCrdsWatch();
  };
}
export async function setupBackgroundTasks() {
  const orchestratorApi = useOrchestratorApi();
  const pollingInterval = await setupMetricPolling();

  const unsubscribeOrchestratorWatches = new OrchestratorUnsubscriber();
  if (await orchestratorApi.test()) {
    unsubscribeOrchestratorWatches.addUnsubscribeAction(await setupOrchestratorWatches(orchestratorApi));
  } else {
    const orchestratorUnsubscriber = orchestratorApi.on(CONNECTED_EVENT, async () => {
      const unsubscriber = await setupOrchestratorWatches(orchestratorApi);
      unsubscribeOrchestratorWatches.addUnsubscribeAction(unsubscriber);
    });
    unsubscribeOrchestratorWatches.addUnsubscribeAction(orchestratorUnsubscriber);
  }
  return () => {
    clearInterval(pollingInterval);
    unsubscribeOrchestratorWatches.unsubscribe();
  };
}

class OrchestratorUnsubscriber {
  private unsubscribeActions: (() => void)[] = [];

  public addUnsubscribeAction(action: () => void) {
    this.unsubscribeActions.push(action);
  }
  public unsubscribe() {
    this.unsubscribeActions.forEach((x) => x());
  }
}
