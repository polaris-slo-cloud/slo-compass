import { IDeployment } from '@/orchestrator/orchestrator-api';

export interface PolarisComponent {
  id: string;
  name: string;
  description: string;
  template: string;
  polarisControllers: PolarisController[];
  failedDeployments?: unknown[];
}

export interface PolarisController {
  type: 'SLO Controller' | 'Metrics Controller' | 'Elasticity Strategy Controller';
  name: string;
  deployment: IDeployment;
}
