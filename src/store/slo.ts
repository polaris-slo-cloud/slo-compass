import { defineStore } from 'pinia';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';
import { applyDeploymentResult } from '@/store/utils';
import { v4 as uuidv4 } from 'uuid';
import { computed, Ref, ref } from 'vue';
import Slo, { DeployedPolarisSloMapping, PolarisSloMapping, SloMetric } from '@/workspace/slo/Slo';
import { WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { useTargetStore } from '@/store/target';
import { findTemplateForKind, getPolarisControllers } from '@/polaris-templates/slo-template';
import { workspaceItemTypes } from '@/workspace/constants';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { NamespacedObjectReference } from '@polaris-sloc/core';

export const useSloStore = defineStore('slo', () => {
  const orchestratorApi = useOrchestratorApi();
  const metricsProvider = useMetricsProvider();
  const elasticityStrategyStore = useElasticityStrategyStore();
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
  function removeSlo(id: WorkspaceComponentId): void {
    slos.value = slos.value.filter((x) => x.id !== id);
  }

  async function deleteSlo(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    if (slo) {
      await orchestratorApi.deleteSlo(slo);
    }
    removeSlo(id);
  }

  async function deploySlo(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const target = slo.target ? targetStore.getSloTarget(slo.target) : null;
    const result = await orchestratorApi.deploySlo(slo, target);
    applyDeploymentResult(slo, result);
    slo.deployedSloMapping = result.deployedSloMapping;
    slo.configChanged = !result.deployedSloMapping;
  }
  async function applySloMapping(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const target = targetStore.getSloTarget(slo.target);
    const appliedSloMapping = await orchestratorApi.applySloMapping(slo, target);
    if (appliedSloMapping) {
      slo.configChanged = false;
      slo.deployedSloMapping = appliedSloMapping;
    }
  }
  async function resetSloMapping(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
    const polarisSloMapping = await orchestratorApi.findSloMapping(slo);
    await updateSlo(slo, {
      reference: slo.deployedSloMapping.reference,
      sloMapping: polarisSloMapping,
    });
  }
  async function updatePolarisMapping(
    id: WorkspaceComponentId,
    polarisSloMapping: PolarisSloMapping,
    reference: NamespacedObjectReference
  ): Promise<void> {
    const slo = getSlo.value(id);
    if (slo.configChanged) {
      slo.deployedSloMapping = {
        reference,
        sloMapping: polarisSloMapping,
      };
      return;
    }
    await updateSlo(slo, {
      reference,
      sloMapping: polarisSloMapping,
    });
  }
  async function updateSlo(slo: Slo, deployedSloMapping: DeployedPolarisSloMapping): Promise<void> {
    const polarisSloMapping = deployedSloMapping.sloMapping;
    let elasticityStrategyId;
    if (polarisSloMapping.elasticityStrategy) {
      elasticityStrategyId = await elasticityStrategyStore.ensureElasticityStrategyCreated(
        polarisSloMapping.elasticityStrategy.kind
      );
    }
    let target;
    if (polarisSloMapping.target) {
      const targetReference = { ...polarisSloMapping.target };
      target = await targetStore.ensureTargetCreated(targetReference);
    }
    saveSlo({
      ...slo,
      config: polarisSloMapping.config,
      target,
      elasticityStrategy: {
        id: elasticityStrategyId,
        kind: polarisSloMapping.elasticityStrategy.kind,
        config: polarisSloMapping.elasticityStrategyConfig,
      },
      deployedSloMapping,
      configChanged: false,
    });
  }
  async function pollMetrics(id: WorkspaceComponentId): Promise<void> {
    const slo = getSlo.value(id);
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

  async function createFromPolarisMapping(
    id: string,
    polarisSloMapping: PolarisSloMapping,
    reference: NamespacedObjectReference
  ) {
    let normalizedName = reference.name
      // Remove UUIDs
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '')
      // Replace - and uppercase first letter
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      .replace('-', ' ')
      // Add spaces in front of uppercase letters
      .replace(/([^ ])([A-Z])/g, '$1 $2')
      .trim();
    normalizedName = normalizedName[0].toUpperCase() + normalizedName.slice(1);
    const template = findTemplateForKind(reference.kind);

    let elasticityStrategyId;
    if (polarisSloMapping.elasticityStrategy) {
      elasticityStrategyId = await elasticityStrategyStore.ensureElasticityStrategyCreated(
        polarisSloMapping.elasticityStrategy.kind
      );
    }
    let target;
    if (polarisSloMapping.target) {
      const targetReference = { ...polarisSloMapping.target, namespace: reference.namespace };
      target = await targetStore.ensureTargetCreated(targetReference);
    }

    const polarisControllers = getPolarisControllers(template);
    for (const controller of polarisControllers) {
      const polarisDeployments = await orchestratorApi.findPolarisDeployments();
      controller.deployment = polarisDeployments.find(
        (x) => x.connectionMetadata.name === template.controllerName
      ).connectionMetadata;
    }

    const slo: Slo = {
      id: id || uuidv4(),
      name: normalizedName,
      description: '',
      type: workspaceItemTypes.slo,
      deployedSloMapping: {
        reference,
        sloMapping: polarisSloMapping,
      },
      template: template.key,
      metrics: template.metrics.map<SloMetric>((x) => ({
        source: x,
      })),
      polarisControllers,
      config: polarisSloMapping.config,
      configChanged: false,
      target,
      elasticityStrategy: {
        id: elasticityStrategyId,
        kind: polarisSloMapping.elasticityStrategy.kind,
        config: polarisSloMapping.elasticityStrategyConfig,
      },
    };

    saveSlo(slo);
    return slo.id;
  }

  function polarisMappingRemoved(ids: WorkspaceComponentId[]) {
    const affectedSlos = slos.value.filter((x) => ids.includes(x.id));
    const changedSlos = affectedSlos.filter((x) => x.configChanged);
    const idsMarkedForDeletion = affectedSlos.filter((x) => !x.configChanged).map((x) => x.id);

    slos.value = slos.value.filter((x) => !idsMarkedForDeletion.includes(x.id));
    for (const slo of changedSlos) {
      slo.deployedSloMapping.deleted = true;
      slo.deployedSloMapping.reference = null;
      slo.deployedSloMapping.sloMapping = null;
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
    updatePolarisMapping,
    createFromPolarisMapping,
    deleteSlo,
    polarisMappingRemoved,
  };
});
