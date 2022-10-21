import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { NamespacedObjectReference } from '@polaris-sloc/core';
import { WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { workspaceItemTypes } from '@/workspace/constants';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';

export const useTargetStore = defineStore('target', () => {
  const orchestratorApi = useOrchestratorApi();
  const targets = ref<SloTarget[]>([]);

  const ensureCreatedSemaphore = ref<Map<string, Promise<void>>>(new Map());
  async function lockTargetName(name: string) {
    if (ensureCreatedSemaphore.value.has(name)) {
      await ensureCreatedSemaphore.value.get(name);
    }

    let unlock;
    const lock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    ensureCreatedSemaphore.value.set(name, lock);
    return () => {
      ensureCreatedSemaphore.value.delete(name);
      unlock();
    };
  }

  const getSloTarget = computed<(id: string) => SloTarget>(() => {
    const targetMap = new Map(targets.value.map((x) => [x.id, x]));
    return (id: string) => targetMap.get(id);
  });

  const getComponents = computed(() => {
    const componentMap = new Map(targets.value.map((x) => [x.id, x]));
    return (id) => {
      const components = getSloTarget.value(id)?.components || [];
      return components.map((x) => componentMap.get(x)).filter((x) => !!x);
    };
  });

  function saveTarget(target: SloTarget) {
    if (!target.id) {
      target.id = uuidv4();
    }
    const existingIndex = targets.value.findIndex((x) => x.id === target.id);
    if (existingIndex >= 0) {
      targets.value[existingIndex] = target;
    } else {
      targets.value.push(target);
    }
  }

  async function ensureTargetCreated(
    objectReference: NamespacedObjectReference
  ): Promise<WorkspaceComponentId> {
    const unlockTargetName = await lockTargetName(`${objectReference.namespace}/${objectReference.name}`);
    const target = targets.value.find(
      (x) =>
        x.deployment.connectionMetadata.name === objectReference.name &&
        x.deployment.connectionMetadata.namespace === objectReference.namespace
    );

    if (target) {
      unlockTargetName();
      return target.id;
    }

    const deployments = await orchestratorApi.findDeployments(objectReference.namespace);
    const deployment = deployments.find((x) => x.connectionMetadata.name === objectReference.name);
    const newTarget: SloTarget = {
      id: uuidv4(),
      name: objectReference.name.replace(/([A-Z])/g, ' $1').trim(),
      components: [],
      type: workspaceItemTypes.targets.component,
      description: '',
      deployment,
    };

    saveTarget(newTarget);
    unlockTargetName();
    return newTarget.id;
  }

  return {
    targets,
    getSloTarget,
    getComponents,
    saveTarget,
    ensureTargetCreated,
  };
});
