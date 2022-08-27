import { IDeployment } from '@/orchestrator/orchestrator-api';

interface ISloTarget {
  id: string;
  name: string;
  type: string;
  deployment: IDeployment;
}

export default interface ISlo {
  name: string;
  description: string;
  targets: ISloTarget[];
  config: unknown;
  template: string;
}
