import { IDeployment } from '@/orchestrator/orchestrator-api';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

interface SloTarget {
  id: string;
  name: string;
  type: string;
  deployment: IDeployment;
}

interface SloElasticityStrategy {
  id: string;
  config: unknown;
}

export default interface Slo extends PolarisComponent {
  name: string;
  description: string;
  targets: SloTarget[];
  config: unknown;
  template: string;
  elasticityStrategy?: SloElasticityStrategy;
  polarisControllers: PolarisController[];
}
