import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ObjectKind } from '@polaris-sloc/core';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { PolarisController } from '@/workspace/PolarisComponent';
import Slo from '@/workspace/slo/Slo';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { defaultElasticityStrategyControllers } from '@/workspace/elasticity-strategy/strategy-template';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { useTemplateStore } from '@/store/template';

export const usePolarisComponentStore = defineStore('polaris-component', () => {
  const orchestratorApi = useOrchestratorApi();
  const elasticityStrategyStore = useElasticityStrategyStore();
  const templateStore = useTemplateStore();

  const deployedSloMappings = ref<ObjectKind[]>([]);
  const deployedSloMappingKinds = computed(
    () => new Set(deployedSloMappings.value.map((x) => ObjectKind.stringify(x)))
  );
  const sloMappingHasBeenDeployed = computed(() => {
    const kindSet = new Set(deployedSloMappings.value.map((x) => x.kind));
    return (kind: string) => kindSet.has(kind);
  });

  const deployedElasticityStrategyCrds = ref<ObjectKind[]>([]);
  const deployedElasticityStrategyCrdKinds = computed(
    () => new Set(deployedElasticityStrategyCrds.value.map((x) => ObjectKind.stringify(x)))
  );

  const sloControllers = ref<PolarisController[]>([]);
  const elasticityStrategyControllers = ref<PolarisController[]>([]);
  const metricControllers = ref<PolarisController[]>([]);
  const allControllers = computed(() => [
    ...sloControllers.value,
    ...elasticityStrategyControllers.value,
    ...metricControllers.value,
  ]);

  const hasMissingPolarisComponent = computed(() => {
    const kindSet = new Set(allControllers.value.map((x) => x.handlesKind));
    return (kind: string) => !kindSet.has(kind);
  });

  function addDeployedSloMapping(kind: ObjectKind) {
    if (!deployedSloMappingKinds.value.has(ObjectKind.stringify(kind))) {
      deployedSloMappings.value.push(kind);
    }
  }

  function removeDeployedSloMapping(kind: ObjectKind) {
    const stringifiedKind = ObjectKind.stringify(kind);
    deployedSloMappings.value = deployedSloMappings.value.filter((x) => ObjectKind.stringify(x) !== stringifiedKind);
  }

  function addDeployedElasticityStrategyCrd(kind: ObjectKind) {
    if (!deployedElasticityStrategyCrdKinds.value.has(ObjectKind.stringify(kind))) {
      deployedElasticityStrategyCrds.value.push(kind);
    }
  }

  function removeDeployedElasticityStrategyCrd(kind: ObjectKind) {
    const stringifiedKind = ObjectKind.stringify(kind);
    deployedElasticityStrategyCrds.value = deployedElasticityStrategyCrds.value.filter(
      (x) => ObjectKind.stringify(x) !== stringifiedKind
    );
  }

  function initializePolarisComponents(polarisClusterComponents: PolarisController[]) {
    sloControllers.value = polarisClusterComponents.filter((x) => x.type === 'SLO Controller');
    elasticityStrategyControllers.value = polarisClusterComponents.filter(
      (x) => x.type === 'Elasticity Strategy Controller'
    );
    metricControllers.value = polarisClusterComponents.filter((x) => x.type === 'Metrics Controller');
  }

  async function deployMissingSloResources(slo: Slo, template: SloTemplateMetadata) {
    if (!sloMappingHasBeenDeployed.value(slo.kind)) {
      await orchestratorApi.deploySloMappingCrd(template);
    }
    if (hasMissingPolarisComponent.value(slo.kind) && template.controllerName && template.containerImage) {
      await orchestratorApi.deploySloController(slo, template);
    }
    const metricSources = slo.metrics.map((x) => templateStore.getSloMetricTemplate(x.source));
    const missingMetricsControllers = metricSources.filter(
      (x) => x.metricsController && hasMissingPolarisComponent.value(x.metricsController.composedMetricKind)
    );
    for (const missingMetricsController of missingMetricsControllers) {
      await orchestratorApi.deployComposedMetricsController(missingMetricsController);
    }
    if (slo.elasticityStrategy && hasMissingPolarisComponent.value(slo.elasticityStrategy.kind)) {
      const elasticityStrategyControllerTemplate = defaultElasticityStrategyControllers.find(
        (x) => x.handlesKind === slo.elasticityStrategy.kind
      );
      if (elasticityStrategyControllerTemplate) {
        const elasticityStrategy = elasticityStrategyStore.getElasticityStrategy(slo.elasticityStrategy.kind);
        await orchestratorApi.deployElasticityStrategyController(
          elasticityStrategy,
          elasticityStrategyControllerTemplate.deploymentMetadata
        );
      }
    }
  }

  function correctControllerAssignment(handlesKind: string, correctedKind: string) {
    const controller = allControllers.value.find((x) => x.handlesKind === handlesKind);
    controller.handlesKind = correctedKind;
  }

  return {
    deployedSloMappings,
    deployedElasticityStrategyCrds,
    sloMappingHasBeenDeployed,
    hasMissingPolarisComponent,
    sloControllers,
    elasticityStrategyControllers,
    metricControllers,
    addDeployedSloMapping,
    removeDeployedSloMapping,
    addDeployedElasticityStrategyCrd,
    removeDeployedElasticityStrategyCrd,
    initializePolarisComponents,
    deployMissingSloResources,
    correctControllerAssignment,
  };
});
