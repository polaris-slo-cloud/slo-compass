import { IDeployment } from '@/orchestrator/orchestrator-api';

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

export default interface Slo {
  name: string;
  description: string;
  targets: SloTarget[];
  config: unknown;
  template: string;
  elasticityStrategy?: SloElasticityStrategy;
}
