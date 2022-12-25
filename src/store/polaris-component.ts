import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ObjectKind } from '@polaris-sloc/core';
import { IDeployment, useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import {
  PolarisController,
  PolarisControllerDeploymentMetadata,
  PolarisControllerType,
} from '@/workspace/PolarisComponent';
import Slo from '@/workspace/slo/Slo';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { useTemplateStore } from '@/store/template';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { SloMetricSourceTemplate } from '@/polaris-templates/slo-metrics/metrics-template';

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

  async function deploySloMapping(template: SloTemplateMetadata) {
    const success = await orchestratorApi.deploySloMappingCrd(template);
    if (success) {
      addDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
    }
  }
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

  function initializePolarisControllers(polarisControllers: PolarisController[]) {
    sloControllers.value = polarisControllers.filter((x) => x.type === PolarisControllerType.Slo);
    elasticityStrategyControllers.value = polarisControllers.filter(
      (x) => x.type === PolarisControllerType.ElasticityStrategy
    );
    metricControllers.value = polarisControllers.filter((x) => x.type === PolarisControllerType.Metric);
  }

  function initializePolarisClusterComponents(polarisClusterComponents: PolarisController[]) {
    const newControllers = polarisClusterComponents.filter((cluster) =>
      allControllers.value.every((local) => local.type !== cluster.type || local.handlesKind !== cluster.handlesKind)
    );

    sloControllers.value.push(...newControllers.filter((x) => x.type === PolarisControllerType.Slo));
    elasticityStrategyControllers.value.push(
      ...newControllers.filter((x) => x.type === PolarisControllerType.ElasticityStrategy)
    );
    metricControllers.value.push(...newControllers.filter((x) => x.type === PolarisControllerType.Metric));
  }

  function addPolarisControllerFromCluster(polarisController: PolarisController) {
    const exists = allControllers.value.some(
      (x) => x.handlesKind === polarisController.handlesKind && x.type === polarisController.type
    );

    if (exists) {
      // TODO: Notify User?
      return;
    }

    switch (polarisController.type) {
      case PolarisControllerType.Slo:
        sloControllers.value.push(polarisController);
        break;
      case PolarisControllerType.ElasticityStrategy:
        elasticityStrategyControllers.value.push(polarisController);
        break;
      case PolarisControllerType.Metric:
        metricControllers.value.push(polarisController);
        break;
    }
  }

  function polarisControllerRemovedFromCluster(namespace: string, name: string) {
    const removedController = allControllers.value.find(
      (x) => x.deployment?.name === name && x.deployment?.namespace === namespace
    );
    const controllerFilter = (x) => x.deployment?.name !== name && x.deployment?.namespace !== namespace;

    switch (removedController?.type) {
      case PolarisControllerType.Slo:
        sloControllers.value = sloControllers.value.filter(controllerFilter);
        break;
      case PolarisControllerType.ElasticityStrategy:
        elasticityStrategyControllers.value = elasticityStrategyControllers.value.filter(controllerFilter);
        break;
      case PolarisControllerType.Metric:
        metricControllers.value = metricControllers.value.filter(controllerFilter);
        break;
    }
  }

  async function deployMissingSloResources(slo: Slo, template: SloTemplateMetadata) {
    if (!sloMappingHasBeenDeployed.value(slo.kind)) {
      await deploySloMapping(template);
    }
    if (hasMissingPolarisComponent.value(slo.kind) && template.sloController) {
      await deploySloController(template);
    }
    const metricSources = slo.metrics.map((x) => templateStore.getSloMetricTemplate(x.source));
    const missingMetricsControllers = metricSources.filter(
      (x) => x.metricsController && hasMissingPolarisComponent.value(x.metricsController.composedMetricKind)
    );
    for (const missingMetricsController of missingMetricsControllers) {
      await deployComposedMetricsController(missingMetricsController);
    }
    if (slo.elasticityStrategy && hasMissingPolarisComponent.value(slo.elasticityStrategy.kind)) {
      const elasticityStrategy = elasticityStrategyStore.getElasticityStrategy(slo.elasticityStrategy.kind);
      if (elasticityStrategy.controllerDeploymentMetadata) {
        await deployElasticityStrategyController(elasticityStrategy);
      }
    }
  }

  function correctControllerAssignment(handlesKind: string, correctedKind: string) {
    const controller = allControllers.value.find((x) => x.handlesKind === handlesKind);
    controller.handlesKind = correctedKind;
  }

  async function deploySloController(sloTemplate: SloTemplateMetadata) {
    const result = await orchestratorApi.deploySloController(sloTemplate);
    if (result.deployedController) {
      addPolarisControllerFromCluster({
        type: PolarisControllerType.Slo,
        handlesKind: sloTemplate.sloMappingKind,
        deployment: result.deployedController,
      });
    }
  }

  async function deployElasticityStrategyController(elasticityStrategy: ElasticityStrategy) {
    const result = await orchestratorApi.deployElasticityStrategyController(elasticityStrategy);
    if (result.deployedController) {
      addPolarisControllerFromCluster({
        type: PolarisControllerType.ElasticityStrategy,
        handlesKind: elasticityStrategy.kind,
        deployment: result.deployedController,
      });
    }
  }

  async function deployComposedMetricsController(metricTemplate: SloMetricSourceTemplate) {
    const result = await orchestratorApi.deployComposedMetricsController(metricTemplate);
    if (result.deployedController) {
      addPolarisControllerFromCluster({
        type: PolarisControllerType.Metric,
        handlesKind: metricTemplate.metricsController.composedMetricKind,
        deployment: result.deployedController,
      });
    }
  }

  async function createControllerDeployment(
    controller: PolarisController,
    deploymentInfo: PolarisControllerDeploymentMetadata
  ) {
    switch (controller.type) {
      case PolarisControllerType.ElasticityStrategy: {
        elasticityStrategyStore.saveControllerDeploymentMetadata(controller.handlesKind, deploymentInfo);
        const elasticityStrategy = elasticityStrategyStore.getElasticityStrategy(controller.handlesKind);
        await deployElasticityStrategyController(elasticityStrategy);
        break;
      }
      case PolarisControllerType.Slo: {
        templateStore.saveSloControllerDeploymentMetadata(controller.handlesKind, deploymentInfo);
        const template = templateStore.getSloTemplate(controller.handlesKind);
        await deploySloController(template);
        break;
      }
      case PolarisControllerType.Metric: {
        templateStore.saveMetricsControllerDeploymentMetadata(controller.handlesKind, deploymentInfo);
        const template = templateStore.findComposedMetricTemplate(controller.handlesKind);
        await deployComposedMetricsController(template);
        break;
      }
    }
  }

  function linkControllerWithDeployment(controller: PolarisController, deployment: IDeployment) {
    controller.deployment = deployment.connectionMetadata;
    switch (controller.type) {
      case PolarisControllerType.ElasticityStrategy: {
        const existingIdx = elasticityStrategyControllers.value.findIndex(
          (x) => x.handlesKind === controller.handlesKind
        );
        if (existingIdx >= 0) {
          elasticityStrategyControllers.value[existingIdx] = controller;
        } else {
          elasticityStrategyControllers.value.push(controller);
        }
        break;
      }
      case PolarisControllerType.Slo: {
        const existingIdx = sloControllers.value.findIndex((x) => x.handlesKind === controller.handlesKind);
        if (existingIdx >= 0) {
          sloControllers.value[existingIdx] = controller;
        } else {
          sloControllers.value.push(controller);
        }
        break;
      }
      case PolarisControllerType.Metric: {
        const existingIdx = metricControllers.value.findIndex((x) => x.handlesKind === controller.handlesKind);
        if (existingIdx >= 0) {
          metricControllers.value[existingIdx] = controller;
        } else {
          metricControllers.value.push(controller);
        }
        break;
      }
    }
  }

  return {
    deployedSloMappings,
    deployedElasticityStrategyCrds,
    sloMappingHasBeenDeployed,
    hasMissingPolarisComponent,
    sloControllers,
    elasticityStrategyControllers,
    metricControllers,
    allControllers,
    deploySloMapping,
    addDeployedSloMapping,
    removeDeployedSloMapping,
    addDeployedElasticityStrategyCrd,
    removeDeployedElasticityStrategyCrd,
    initializePolarisControllers,
    initializePolarisClusterComponents,
    deployMissingSloResources,
    correctControllerAssignment,
    addPolarisControllerFromCluster,
    polarisControllerRemovedFromCluster,
    createControllerDeployment,
    linkControllerWithDeployment,
  };
});
