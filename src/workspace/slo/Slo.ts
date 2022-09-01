import { IDeployment } from '@/orchestrator/orchestrator-api';

interface SloTarget {
  id: string;
  name: string;
  type: string;
  deployment: IDeployment;
}

export default interface Slo {
  name: string;
  description: string;
  targets: SloTarget[];
  config: unknown;
  template: string;
}
