import { Component } from 'vue';
import kubernetes from './kubernetes/metadata';
import { IOrchestratorConnection } from '@/connections/storage';
import { IPolarisOrchestratorApi } from '@/orchestrator/orchestrator-api';

export interface ConnectionSettingsComponent {
  native?: Component;
  web?: Component;
}

export interface IConfigureOrchestrator {
  name: string;
  connectionSettingsComponent?: ConnectionSettingsComponent;
  polarisSettingsComponent?: Component;
  createOrchestratorApi(connection: IOrchestratorConnection): IPolarisOrchestratorApi;
}

const orchestrators: IConfigureOrchestrator[] = [kubernetes];

const orchestratorMap = orchestrators.reduce((map, config) => {
  map.set(config.name, config);
  return map;
}, new Map<string, IConfigureOrchestrator>());

export function getOrchestrator(name: string): IConfigureOrchestrator {
  return orchestratorMap.get(name);
}
export const availableOrchestrators = orchestrators.map((x) => x.name);
