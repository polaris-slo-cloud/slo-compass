import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { applyDeploymentResult } from '@/store/utils';

export const useElasticityStrategyStore = defineStore('elasticityStrategy', () => {
  const orchestratorApi = useOrchestratorApi();

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
    const result = await orchestratorApi.deployElasticityStrategy(elasticityStrategy);
    applyDeploymentResult(elasticityStrategy, result);
  }
  return {
    elasticityStrategies,
    getElasticityStrategy,
    saveElasticityStrategy,
    deployElasticityStrategy,
  };
});
