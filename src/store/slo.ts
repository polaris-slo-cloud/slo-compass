import { defineStore } from 'pinia';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';
import { applyDeploymentResult } from '@/store/utils';
import { v4 as uuidv4 } from 'uuid';
import { computed, Ref, ref } from 'vue';
import Slo from '@/workspace/slo/Slo';
import { WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { useTargetStore } from '@/store/target';

export const useSloStore = defineStore('slo', () => {
  const orchestratorApi = useOrchestratorApi();
  const metricsProvider = useMetricsProvider();
  const targetStore = useTargetStore();

  const slos: Ref<Slo[]> = ref<Slo[]>([]);

  const getSlo = computed(() => {
    const sloMap = new Map(slos.value.map((x) => [x.id, x]));
    return (id: WorkspaceComponentId) => sloMap.get(id);
  });

  function saveSlo(slo: Slo): void {
    if (!slo.id) {
      slo.id = uuidv4();
    }
    const existingIndex = slos.value.findIndex((x) => x.id === slo.id);
    if (existingIndex >= 0) {
      slos.value[existingIndex] = slo;
    } else {
      slos.value.push(slo);
    }
  }
  async function deploySlo(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const target = slo.target ? targetStore.getSloTarget(slo.target) : null;
    const result = await orchestratorApi.deploySlo(slo, target);
    applyDeploymentResult(slo, result);
    slo.sloMapping = result.deployedSloMapping;
    slo.configChanged = !result.deployedSloMapping;
  }
  async function applySloMapping(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const target = targetStore.getSloTarget(slo.target);
    const appliedSloMapping = await orchestratorApi.applySloMapping(slo, target);
    if (appliedSloMapping) {
      slo.sloMapping = appliedSloMapping;
    }
    slo.configChanged = !appliedSloMapping && slo.configChanged;
  }
  async function resetSloMapping(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const polarisSloMapping = await orchestratorApi.findSloMapping(slo);
    const elasticityStrategy = this.workspace.elasticityStrategies.find(
      (x) => x.kind === polarisSloMapping.elasticityStrategy
    );
    const target = this.workspace.targets.find(
      (t) => t.deployment.connectionMetadata.name === polarisSloMapping.target.name
      // TODO: Add the next line if the namespace is added to the SloMapping CRD spec
      //&& t.deployment.connectionMetadata.namespace === polarisSloMapping.target.namespace
    )?.id;
    this.saveSlo({
      ...slo,
      config: polarisSloMapping.config,
      target,
      elasticityStrategy: {
        id: elasticityStrategy?.id,
        kind: polarisSloMapping.elasticityStrategy,
        config: polarisSloMapping.elasticityStrategyConfig,
      },
      configChanged: false,
    });
  }
  async function pollMetrics(id: WorkspaceComponentId): Promise<void> {
    const slo = this.getSlo(id);
    const metrics = await metricsProvider.pollSloMetrics(slo, targetStore.getSloTarget(slo.target));
    const lastUpdated = new Date();
    for (const prometheusMetric of metrics) {
      const sloMetric = slo.metrics.find((x) => x.source.displayName === prometheusMetric.metric);
      sloMetric.value = prometheusMetric.value;
      sloMetric.lastUpdated = lastUpdated;
    }
  }
  function updateSloMetrics(sloMetricMappings): void {
    const lastUpdated = new Date();
    for (const mapping of sloMetricMappings) {
      const slo = getSlo.value(mapping.slo);
      const metric = slo.metrics.find((x) => x.source.displayName === mapping.metric);
      metric.value = mapping.value;
      metric.lastUpdated = lastUpdated;
    }
  }

  return {
    slos,
    getSlo,
    saveSlo,
    deploySlo,
    applySloMapping,
    resetSloMapping,
    pollMetrics,
    updateSloMetrics,
  };
});
