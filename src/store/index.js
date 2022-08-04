import { defineStore } from 'pinia';
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
