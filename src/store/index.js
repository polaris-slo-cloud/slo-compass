import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import workspaceFileService from '../workspace/workspace-file-service';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
//import polarisConnector from "../polaris-connector";
const orchestratorApi = useOrchestratorApi();

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    isOpened: false,
    workspace: {
      targets: [],
      slos: [],
    },
    runningDeploymentActions: {},
  }),
  actions: {
    createWorkspace() {
      this.isOpened = true;
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
    deploy(item) {
      switch (item.type.toLowerCase()) {
        case 'slo':
          this.deploySlo(item);
          break;
      }
    },
    async deploySlo(slo) {
      this.runningDeploymentActions[slo.id] = {
        type: 'SLO',
        name: slo.name,
        dismissed: false,
      };
      slo.deploymentStatus = await orchestratorApi.deploySlo(slo);
      delete this.runningDeploymentActions[slo.id];
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
      let itemsMap = state.workspace.targets.reduce(mapItemById, new Map());
      itemsMap = state.workspace.slos.reduce(mapItemById, itemsMap);
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
