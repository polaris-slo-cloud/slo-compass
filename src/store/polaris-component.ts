import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ObjectKind } from '@polaris-sloc/core';
import { PolarisController } from '@/workspace/PolarisComponent';

export const usePolarisComponentStore = defineStore('polaris-component', () => {
  const deployedSloMappings = ref<ObjectKind[]>([]);
  const deployedSloMappingKinds = computed(() => deployedSloMappings.value.map((x) => ObjectKind.stringify(x)));
  const sloMappingHasBeenDeployed = computed(() => {
    const kindSet = new Set(deployedSloMappings.value.map((x) => x.kind));
    return (kind: string) => kindSet.has(kind);
  });

  const sloControllers = ref<PolarisController[]>([]);
  const elasticityStrategyControllers = ref<PolarisController[]>([]);
  const metricControllers = ref<PolarisController[]>([]);
  const hasMissingPolarisComponent = computed(() => {
    const allControllers = [
      ...sloControllers.value,
      ...elasticityStrategyControllers.value,
      ...metricControllers.value,
    ];
    const kindSet = new Set(allControllers.map((x) => x.handlesKind));
    return (kind: string) => !kindSet.has(kind);
  });

  function addDeployedSloMapping(kind: ObjectKind) {
    if (!deployedSloMappingKinds.value.includes(ObjectKind.stringify(kind))) {
      deployedSloMappings.value.push(kind);
    }
  }

  function removeDeployedSloMapping(kind: ObjectKind) {
    const stringifiedKind = ObjectKind.stringify(kind);
    deployedSloMappings.value = deployedSloMappings.value.filter((x) => ObjectKind.stringify(x) !== stringifiedKind);
  }

  function initializePolarisComponents(polarisClusterComponents: PolarisController[]) {
    sloControllers.value = polarisClusterComponents.filter((x) => x.type === 'SLO Controller');
    elasticityStrategyControllers.value = polarisClusterComponents.filter(
      (x) => x.type === 'Elasticity Strategy Controller'
    );
    metricControllers.value = polarisClusterComponents.filter((x) => x.type === 'Metrics Controller');
  }

  return {
    deployedSloMappings,
    sloMappingHasBeenDeployed,
    hasMissingPolarisComponent,
    sloControllers,
    elasticityStrategyControllers,
    metricControllers,
    addDeployedSloMapping,
    removeDeployedSloMapping,
    initializePolarisComponents,
  };
});
