import { NamespacedObjectReference } from '@polaris-sloc/core';
import { PolarisResource } from '@/orchestrator/orchestrator-api';

export interface PolarisComponent {
  id: string;
  name: string;
  description: string;
  template: string;
  polarisControllers: PolarisController[];
  failedDeployments?: PolarisResource[];
}

export interface PolarisController {
  type: 'SLO Controller' | 'Metrics Controller' | 'Elasticity Strategy Controller';
  name: string;
  deployment: NamespacedObjectReference;
}
