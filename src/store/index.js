import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import workspaceFileService from '../workspace/workspace-file-service';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';
import { getWorkspace, markWorkspaceAsUsed } from '@/workspace/store-helper';
//import polarisConnector from "../polaris-connector";
const orchestratorApi = useOrchestratorApi();
const metricsProvider = useMetricsProvider();

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
    metricsProvider: null,
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
        metricsProvider: config.metricsProvider,
      });
      orchestratorApi.connect(config.orchestrator.connection, config.orchestrator.polarisOptions);
      if (config.metricsProvider) {
        metricsProvider.connect(config.metricsProvider);
      }
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
      if (workspace.metricsProvider) {
        metricsProvider.connect(workspace.metricsProvider);
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
      const target = slo.target ? this.getItem(slo.target) : null;
      const result = await orchestratorApi.deploySlo(slo, target);
      applyDeploymentResult(slo, result);
      slo.sloMapping = result.deployedSloMapping;
      slo.configChanged = !result.deployedSloMapping;
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
      const target = this.getSloTarget(slo.target);
      const appliedSloMapping = await orchestratorApi.applySloMapping(slo, target);
      if (appliedSloMapping) {
        slo.sloMapping = appliedSloMapping;
      }
      slo.configChanged = !appliedSloMapping && slo.configChanged;
      delete this.runningDeploymentActions[slo.id];
    },
    async resetSloMapping(slo) {
      const polarisSloMapping = await orchestratorApi.findSloMapping(slo);
      const elasticityStrategy = this.workspace.elasticityStrategies.find(
        (x) => x.kind === polarisSloMapping.elasticityStrategy
      );
      const target = this.workspace.targets.find(
        (t) => t.deployment.connectionMetadata.name === polarisSloMapping.target.name
        // TODO: Add the next line if the namespace is added to the SloMapping CRD spec
        //&& t.deployment.connectionMetadata.namespace === polarisSloMapping.target.namespace
      )?.id;
      this.saveSlo({
        ...slo,
        config: polarisSloMapping.config,
        target,
        elasticityStrategy: {
          id: elasticityStrategy?.id,
          kind: polarisSloMapping.elasticityStrategy,
          config: polarisSloMapping.elasticityStrategyConfig,
        },
        configChanged: false,
      });
    },
    async pollMetrics(sloId) {
      const slo = this.getSlo(sloId);
      const metrics = await metricsProvider.pollSloMetrics(slo, this.getSloTarget(slo.target));
      const lastUpdated = Date();
      for (const prometheusMetric of metrics) {
        const sloMetric = slo.metrics.find((x) => x.source.displayName === prometheusMetric.metric);
        sloMetric.value = prometheusMetric.value;
        sloMetric.lastUpdated = lastUpdated;
      }
    },
    updateSloMetrics(sloMetricMappings) {
      const lastUpdated = Date();
      for (const mapping of sloMetricMappings) {
        const slo = this.workspace.slos.find((x) => x.id === mapping.slo);
        const metric = slo.metrics.find((x) => x.source.displayName === mapping.metric);
        metric.value = mapping.value;
        metric.lastUpdated = lastUpdated;
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
    getSloTarget: (state) => {
      const targetMap = new Map(state.workspace.targets.map((x) => [x.id, x]));
      return (id) => targetMap.get(id);
    },
    getSlo: (state) => {
      const sloMap = new Map(state.workspace.slos.map((x) => [x.id, x]));
      return (id) => sloMap.get(id);
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
