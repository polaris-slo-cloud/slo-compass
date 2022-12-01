import { NamespacedObjectReference } from '@polaris-sloc/core';
import { PolarisResource } from '@/orchestrator/orchestrator-api';
import { workspaceItemTypes } from '@/workspace/constants';

export type WorkspaceComponentType =
  | workspaceItemTypes.slo
  | workspaceItemTypes.targets.application
  | workspaceItemTypes.targets.component
  | workspaceItemTypes.elasticityStrategy;

export type WorkspaceComponentId = string;

export interface WorkspaceComponent {
  id: WorkspaceComponentId;
  name: string;
  type: WorkspaceComponentType;
  description: string;
}

export interface PolarisComponent {
  failedDeployments?: PolarisResource[];
}

export interface PolarisControllerDeploymentMetadata {
  name: string;
  containerImage: string;
}

export interface PolarisController {
  type: 'SLO Controller' | 'Metrics Controller' | 'Elasticity Strategy Controller';
  handlesKind: string;
  deployment?: NamespacedObjectReference;
  deploymentMetadata?: PolarisControllerDeploymentMetadata;
}
