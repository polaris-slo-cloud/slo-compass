import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import workspaceFileService from '../workspace/workspace-file-service';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { getWorkspace, markWorkspaceAsUsed } from '@/workspace/store-helper';
//import polarisConnector from "../polaris-connector";
const orchestratorApi = useOrchestratorApi();

function applyDeploymentResult(item, result) {
  item.failedDeployments = result.failedResources;
  item.polarisControllers = item.polarisControllers.map((controller) => {
    const mapped = { ...controller };
    const deployment = result.deployedControllers.find(
      (x) => x.name === controller.name
    )?.deployment;
    if (deployment) {
      mapped.deployment = deployment;
    }
    return mapped;
  });
}

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    isOpened: false,
    workspaceId: null,
    name: null,
    location: null,
    orchestrator: null,
    workspace: {
      targets: [],
      slos: [],
      elasticityStrategies: [],
    },
    runningDeploymentActions: {},
  }),
  actions: {
    createWorkspace(config) {
      let location = null;
      if (config.workspaceDirectory && window.filesApi) {
        location = window.filesApi.combinePaths(config.workspaceDirectory, 'workspace.pui');
      }
      this.$patch({
        isOpened: true,
        workspaceId: uuidv4(),
        name: config.name,
        location,
        orchestrator: config.orchestrator,
      });
      orchestratorApi.connect(config.orchestrator.connection, config.orchestrator.polarisOptions);
      markWorkspaceAsUsed(this.$state);
    },
    async loadWorkspace(workspaceId) {
      const workspace = await getWorkspace(workspaceId);
      this.$patch({
        ...workspace,
        isOpened: true,
      });
      markWorkspaceAsUsed(this.$state);
      if (workspace.orchestrator) {
        orchestratorApi.connect(
          workspace.orchestrator.connection,
          workspace.orchestrator.polarisOptions
        );
      }
    },
    async openWorkspace() {
      this.workspace = await workspaceFileService.openWorkspaceFile();
      this.isOpened = true;
    },
    save(item) {
      switch (item.type.toLowerCase()) {
        case 'application':
        case 'component':
          this.saveTarget(item);
          break;
        case 'slo':
          this.saveSlo(item);
          break;
        case 'elasticitystrategy':
          this.saveElasticityStrategy(item);
          break;
      }
    },
    saveTarget(component) {
      if (!component.id) {
        component.id = uuidv4();
      }
      const existingIndex = this.workspace.targets.findIndex((x) => x.id === component.id);
      if (existingIndex >= 0) {
        this.workspace.targets[existingIndex] = component;
      } else {
        this.workspace.targets.push(component);
      }
    },
    saveSlo(slo) {
      if (!slo.id) {
        slo.id = uuidv4();
      }
      const existingIndex = this.workspace.slos.findIndex((x) => x.id === slo.id);
      if (existingIndex >= 0) {
        this.workspace.slos[existingIndex] = slo;
      } else {
        this.workspace.slos.push(slo);
      }
    },
    saveElasticityStrategy(strategy) {
      if (!strategy.id) {
        strategy.id = uuidv4();
      }
      const existingIndex = this.workspace.elasticityStrategies.findIndex(
        (x) => x.id === strategy.id
      );
      if (existingIndex >= 0) {
        this.workspace.elasticityStrategies[existingIndex] = strategy;
      } else {
        this.workspace.elasticityStrategies.push(strategy);
      }
    },
    async deploySlo(slo) {
      this.runningDeploymentActions[slo.id] = {
        type: slo.type,
        name: slo.name,
        dismissed: false,
      };
      const targets = slo.targets.map((x) => this.getItem(x));
      const result = await orchestratorApi.deploySlo(slo, targets);
      applyDeploymentResult(slo, result);
      slo.sloMappings = result.deployedSloMappings;
      slo.failedSloMappings = result.failedSloMappings;
      slo.configChanged = result.failedSloMappings.length > 0;
      delete this.runningDeploymentActions[slo.id];
    },
    async deployElasticityStrategy(elasticityStrategy) {
      this.runningDeploymentActions[elasticityStrategy.id] = {
        type: elasticityStrategy.type,
        name: elasticityStrategy.name,
        dismissed: false,
      };
      const result = await orchestratorApi.deployElasticityStrategy(elasticityStrategy);
      applyDeploymentResult(elasticityStrategy, result);
      delete this.runningDeploymentActions[elasticityStrategy.id];
    },
    async retryDeployment(item) {
      this.runningDeploymentActions[item.id] = {
        type: item.type,
        name: item.name,
        dismissed: false,
      };
      const result = await orchestratorApi.retryDeployment(item);
      applyDeploymentResult(item, result);
      delete this.runningDeploymentActions[item.id];
    },
    async applySloMapping(slo) {
      this.runningDeploymentActions[slo.id] = {
        type: slo.type,
        name: slo.name,
        dismissed: false,
      };
      const targets = slo.targets.map((x) => this.getItem(x));
      const response = await orchestratorApi.applySloMapping(slo, targets);
      slo.configChanged = !(response.failedSloMappings.length === 0 || !slo.configChanged);
      delete this.runningDeploymentActions[slo.id];
    },
    async resetSloMapping(slo) {
      const polarisSloMappings = await orchestratorApi.findSloMappings(slo);
      if (polarisSloMappings.length > 0) {
        // This is a naive approach where all SLO Mappings are equal except for their target
        // TODO: Find logic to map different mappings to one or more SLOs
        const polarisSloMapping = polarisSloMappings[0];
        const elasticityStrategy = this.workspace.elasticityStrategies.find(
          (x) => x.kind === polarisSloMapping.elasticityStrategy
        );
        const targets = polarisSloMappings
          .map((x) => {
            return this.workspace.targets.find(
              (t) =>
                t.connectionMetadata.name === x.target.name &&
                t.connectionMetadata.namespace === x.target.namespace
            )?.id;
          })
          .filter((x) => !!x);
        slo = {
          ...slo,
          config: polarisSloMapping.config,
          targets,
          elasticityStrategy: {
            id: elasticityStrategy?.id,
            kind: polarisSloMapping.elasticityStrategy,
            config: polarisSloMapping.elasticityStrategyConfig,
          },
        };
      }
    },
    dismissRunningDeploymentActions() {
      Object.values(this.runningDeploymentActions).forEach((val) => (val.dismissed = true));
    },
  },
  getters: {
    getComponents: (state) => {
      const componentMap = state.workspace.targets.reduce((map, target) => {
        map.set(target.id, target);
        return map;
      }, new Map());
      return (componentId) => {
        const components =
          state.workspace.targets.find((x) => x.id === componentId)?.components || [];
        return components.map((x) => componentMap.get(x)).filter((x) => !!x);
      };
    },
    getItem: (state) => {
      const mapItemById = (map, item) => {
        map.set(item.id, item);
        return map;
      };
      const allItems = [
        ...state.workspace.targets,
        ...state.workspace.slos,
        ...state.workspace.elasticityStrategies,
      ];
      const itemsMap = allItems.reduce(mapItemById, new Map());
      return (id) => itemsMap.get(id);
    },
    runningDeploymentNames: (state) =>
      Object.values(state.runningDeploymentActions)
        .map((x) => x.name)
        .join(', '),
    hasUndismissedDeploymentActions: (state) =>
      Object.values(state.runningDeploymentActions).some((x) => !x.dismissed),
    hasRunningDeployment: (state) => (id) => !!state.runningDeploymentActions[id],
  },
});
/*
export const useStore = defineStore('main', {
  state: () => ({
    workspace: {},
    sloGraph: {},
    initialized: false,
  }),
  actions: {
    async initialize() {
      if (this.initialized) {
        return;
      }
      await this.loadWorkspace();
      this.initialized = true;
    },
    async loadWorkspace() {
      this.workspace = await polarisConnector.getControllers();
    },
  },
});*/
