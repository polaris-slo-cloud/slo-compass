import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { workspaceItemTypes } from '@/workspace/constants';
import {PolarisControllerDeploymentMetadata, WorkspaceComponentId} from '@/workspace/PolarisComponent';
import { defaultStrategies } from '@/workspace/elasticity-strategy/strategy-template';
import { ElasticityStrategyConfigParameter } from '@/polaris-templates/parameters';

export const useElasticityStrategyStore = defineStore('elasticityStrategy', () => {
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

  const elasticityStrategies = ref<ElasticityStrategy[]>(defaultStrategies);

  const getElasticityStrategy = computed(() => {
    const strategiesMap = new Map(elasticityStrategies.value.map((x) => [x.kind, x]));
    return (kind) => strategiesMap.get(kind);
  });

  function saveElasticityStrategy(strategy: ElasticityStrategy) {
    if (!strategy.id) {
      strategy.id = uuidv4();
    }
    const existingIndex = elasticityStrategies.value.findIndex((x) => x.kind === strategy.kind);
    if (existingIndex >= 0) {
      elasticityStrategies.value[existingIndex] = strategy;
    } else {
      elasticityStrategies.value.push(strategy);
    }
  }

  function saveElasticityStrategyFromPolaris(strategy: ElasticityStrategy) {
    const existingElasticityStrategy = getElasticityStrategy.value(strategy.kind);
    if (existingElasticityStrategy) {
      if (!existingElasticityStrategy.confirmed) {
        existingElasticityStrategy.sloSpecificConfig = strategy.sloSpecificConfig;
      } else {
        const oldPropertyKeys = existingElasticityStrategy.sloSpecificConfig.map((x) => x.parameter);
        const newPropertyKeys = strategy.sloSpecificConfig.map((x) => x.parameter);
        const newProperties = strategy.sloSpecificConfig.filter((x) => !oldPropertyKeys.includes(x.parameter));
        const removedPropertyKeys = existingElasticityStrategy.sloSpecificConfig
          .filter((x) => !newPropertyKeys.includes(x.parameter))
          .map((x) => x.parameter);

        for (const entry of existingElasticityStrategy.sloSpecificConfig) {
          const entryInNewStrategy = strategy.sloSpecificConfig.find((x) => x.parameter === entry.parameter);
          if (entryInNewStrategy) {
            entry.valueOptions = entryInNewStrategy.valueOptions;
          }
        }

        if (newProperties.length > 0 || removedPropertyKeys.length > 0) {
          existingElasticityStrategy.sloSpecificConfig = [
            ...existingElasticityStrategy.sloSpecificConfig,
            ...newProperties,
          ].filter((x) => !removedPropertyKeys.includes(x.parameter));
          existingElasticityStrategy.confirmed = false;
        }
      }
    } else {
      elasticityStrategies.value.push(strategy);
    }
  }

  function confirmElasticityStrategy(kind: string, sloSpecificConfig: ElasticityStrategyConfigParameter[]) {
    const elasticityStrategy = getElasticityStrategy.value(kind);
    if (!elasticityStrategy) {
      //TODO: This elasticity strategy does not exists, do we need a notification here?
      return;
    }

    elasticityStrategy.sloSpecificConfig = sloSpecificConfig;
    elasticityStrategy.confirmed = true;
  }

  function removeElasticityStrategy(kind: string) {
    elasticityStrategies.value = elasticityStrategies.value.filter((x) => x.kind !== kind);
  }

  async function ensureElasticityStrategyCreated(kind: string): Promise<WorkspaceComponentId> {
    const unlockKind = await lockKind(kind);
    const strategy = getElasticityStrategy.value(kind);
    if (strategy) {
      unlockKind();
      return strategy.id;
    }

    // TODO: This should only happen if the elasticity strategy does not exist inside the Polaris Cluster. Display a warning to the user
    const newStrategy: ElasticityStrategy = {
      id: uuidv4(),
      type: workspaceItemTypes.elasticityStrategy,
      name: kind.replace(/([A-Z])/g, ' $1').trim(),
      description: '',
      kind,
      kindPlural: '',
      sloSpecificConfig: [],
      confirmed: false,
    };
    saveElasticityStrategy(newStrategy);
    unlockKind();
    return newStrategy.id;
  }

  function saveControllerDeploymentMetadata(kind: string, deploymentInfo: PolarisControllerDeploymentMetadata) {
    const elasticityStrategy = getElasticityStrategy.value(kind);
    if (!elasticityStrategy) {
      // TODO: Notify User?
      return;
    }

    elasticityStrategy.controllerDeploymentMetadata = deploymentInfo;
  }

  return {
    elasticityStrategies,
    getElasticityStrategy,
    saveElasticityStrategy,
    saveElasticityStrategyFromPolaris,
    confirmElasticityStrategy,
    ensureElasticityStrategyCreated,
    removeElasticityStrategy,
    saveControllerDeploymentMetadata,
  };
});
