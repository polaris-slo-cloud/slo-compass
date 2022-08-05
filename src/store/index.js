import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import workspaceFileService from '../workspace/workspace-file-service';
//import polarisConnector from "../polaris-connector";

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    isOpened: false,
    workspace: {},
  }),
  actions: {
    createWorkspace() {
      this.isOpened = true;
    },
    async openWorkspace() {
      this.workspace = await workspaceFileService.openWorkspaceFile();
      this.isOpened = true;
    },
    addTarget(component) {
      if (!this.workspace.targets) {
        this.$patch({ workspace: { ...this.workspace, targets: [] } });
      }
      if (!component.id) {
        component.id = uuidv4();
      }
      this.workspace.targets.push(component);
    },
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
