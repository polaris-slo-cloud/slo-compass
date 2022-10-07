import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { SloTarget } from '@/workspace/targets/SloTarget';

export const useTargetStore = defineStore('target', () => {
  const targets = ref<SloTarget[]>([]);

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

  return {
    targets,
    getSloTarget,
    getComponents,
    saveTarget,
  };
});
