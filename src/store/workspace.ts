import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useSloStore } from '@/store/slo';
import { WorkspaceComponent, WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { useTargetStore } from '@/store/target';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { applyDeploymentResult } from '@/store/utils';
import Slo from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { workspaceItemTypes } from '@/workspace/constants';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { ObjectKind, POLARIS_API } from '@polaris-sloc/core';
import { distinctBy } from '@/crosscutting/list-utils';

declare global {
  interface Window {
    filesApi?: {
      combinePaths(directory, fileName);
    };
  }
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const elasticityStrategyStore = useElasticityStrategyStore();
  const orchestratorApi = useOrchestratorApi();

  const isOpened = ref<boolean>(false);
  const workspaceId = ref<string>(null);
  const name = ref<string>(null);
  const location = ref<string>(null);
  const polarisOptions = ref(null);
  const watchBookmarks = ref({});
  const deployedSloMappings = ref<ObjectKind[]>([]);
  const deployedSloMappingKinds = computed(() => deployedSloMappings.value.map((x) => ObjectKind.stringify(x)));

  const usedElasticityStrategyKinds = computed<ObjectKind[]>(() =>
    slos.value
      .map((x) => ({
        kind: x.elasticityStrategy.kind,
        version: 'v1',
        group: POLARIS_API.ELASTICITY_GROUP,
      }))
      .filter(distinctBy((x) => x.kind))
  );

  const slos = computed<Slo[]>(() => sloStore.slos);
  const targets = computed<SloTarget[]>(() => targetStore.targets);
  const elasticityStrategies = computed<ElasticityStrategy[]>(() => elasticityStrategyStore.elasticityStrategies);

  const getItem = computed<(id: string) => WorkspaceComponent>(() => {
    const allItems = [...targets.value, ...slos.value, ...elasticityStrategies.value];
    const byId = new Map(allItems.map((x: WorkspaceComponent) => [x.id, x]));
    return (id: string) => byId.get(id);
  });

  const deleteItemAction = computed(() => {
    const sloActions = new Map(slos.value.map((x) => [x.id, async () => await sloStore.deleteSlo(x.id)]));
    return (id: WorkspaceComponentId) => sloActions.get(id);
  });

  function createWorkspace(config) {
    let location = null;
    if (config.workspaceDirectory && window.filesApi) {
      location = window.filesApi.combinePaths(config.workspaceDirectory, 'workspace.pui');
    }
    this.$patch({
      isOpened: true,
      workspaceId: uuidv4(),
      name: config.name,
      location,
      polarisOptions: config.orchestrator.polarisOptions,
    });
  }
  function loadWorkspace(workspace) {
    sloStore.slos = workspace.slos;
    targetStore.targets = workspace.targets;
    elasticityStrategyStore.elasticityStrategies = workspace.elasticityStrategies;
    this.$patch({
      ...workspace,
      isOpened: true,
    });
  }

  async function retryDeployment(item) {
    const result = await orchestratorApi.retryDeployment(item);
    applyDeploymentResult(item, result);
  }

  function save(item: WorkspaceComponent) {
    switch (item.type) {
      case workspaceItemTypes.target.application:
      case workspaceItemTypes.target.component:
        targetStore.saveTarget(item as SloTarget);
        break;
      case workspaceItemTypes.slo:
        sloStore.saveSlo(item as Slo);
        break;
      case workspaceItemTypes.elasticityStrategy:
        elasticityStrategyStore.saveElasticityStrategy(item as ElasticityStrategy);
        break;
    }
  }

  async function deleteItem(itemId: WorkspaceComponentId) {
    const deleteAction = deleteItemAction.value(itemId);
    if (deleteAction) {
      await deleteAction();
    }
  }

  function updateWatchBookmark(kind: string, bookmark: string) {
    watchBookmarks.value[kind] = bookmark;
  }

  function addDeployedSloMapping(kind: ObjectKind) {
    if (!deployedSloMappingKinds.value.includes(ObjectKind.stringify(kind))) {
      deployedSloMappings.value.push(kind);
    }
  }

  function removeDeployedSloMapping(kind: ObjectKind) {
    const stringifiedKind = ObjectKind.stringify(kind);
    deployedSloMappings.value = deployedSloMappings.value.filter((x) => ObjectKind.stringify(x) !== stringifiedKind);
  }

  return {
    isOpened,
    workspaceId,
    name,
    location,
    polarisOptions,
    slos,
    targets,
    elasticityStrategies,
    getItem,
    watchBookmarks,
    deployedSloMappings,
    usedElasticityStrategyKinds,
    createWorkspace,
    loadWorkspace,
    retryDeployment,
    save,
    updateWatchBookmark,
    deleteItem,
    addDeployedSloMapping,
    removeDeployedSloMapping,
  };
});
