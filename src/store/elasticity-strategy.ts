import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { applyDeploymentResult } from '@/store/utils';
import { workspaceItemTypes } from '@/workspace/constants';
import { WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { getPolarisControllers } from '@/polaris-templates/strategy-template';
import { useTemplateStore } from '@/store/template';

export const useElasticityStrategyStore = defineStore('elasticityStrategy', () => {
  const orchestratorApi = useOrchestratorApi();
  const templateStore = useTemplateStore();

  const ensureCreatedSemaphore = ref<Map<string, Promise<void>>>(new Map());
  async function lockKind(kind: string) {
    if (ensureCreatedSemaphore.value.has(kind)) {
      await ensureCreatedSemaphore.value.get(kind);
    }

    let unlock;
    const lock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    ensureCreatedSemaphore.value.set(kind, lock);
    return () => {
      ensureCreatedSemaphore.value.delete(kind);
      unlock();
    };
  }

  const elasticityStrategies = ref<ElasticityStrategy[]>([]);

  const getElasticityStrategy = computed(() => {
    const strategiesMap = new Map(elasticityStrategies.value.map((x) => [x.id, x]));
    return (id) => strategiesMap.get(id);
  });

  function saveElasticityStrategy(strategy: ElasticityStrategy) {
    if (!strategy.id) {
      strategy.id = uuidv4();
    }
    const existingIndex = elasticityStrategies.value.findIndex((x) => x.id === strategy.id);
    if (existingIndex >= 0) {
      elasticityStrategies.value[existingIndex] = strategy;
    } else {
      elasticityStrategies.value.push(strategy);
    }
  }

  async function deployElasticityStrategy(id) {
    const elasticityStrategy = getElasticityStrategy.value(id);
    const result = await orchestratorApi.deployElasticityStrategy(elasticityStrategy, templateStore.getElasticityStrategyTemplate(elasticityStrategy.template));
    applyDeploymentResult(elasticityStrategy, result);
  }

  async function ensureElasticityStrategyCreated(kind: string): Promise<WorkspaceComponentId> {
    const unlockKind = await lockKind(kind);
    const strategy = elasticityStrategies.value.find((x) => x.template === kind);
    if (strategy) {
      unlockKind();
      return strategy.id;
    }

    const template = templateStore.getElasticityStrategyTemplate(kind);
    const polarisControllers = getPolarisControllers(template);
    for (const controller of polarisControllers) {
      const polarisDeployments = await orchestratorApi.findPolarisDeployments();
      controller.deployment = polarisDeployments.find(
        (x) => x.connectionMetadata.name === template.controllerName
      )?.connectionMetadata;
    }

    const newStrategy: ElasticityStrategy = {
      id: uuidv4(),
      type: workspaceItemTypes.elasticityStrategy,
      name: kind.replace(/([A-Z])/g, ' $1').trim(),
      description: '',
      template: template.elasticityStrategyKind,
      polarisControllers,
    };
    saveElasticityStrategy(newStrategy);
    unlockKind();
    return newStrategy.id;
  }

  return {
    elasticityStrategies,
    getElasticityStrategy,
    saveElasticityStrategy,
    deployElasticityStrategy,
    ensureElasticityStrategyCreated,
  };
});
