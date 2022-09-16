import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

export default interface ElasticityStrategy extends PolarisComponent {
  id: string;
  name: string;
  description: string;
  kind: string;
  template: string;
  polarisControllers: PolarisController[];
}
