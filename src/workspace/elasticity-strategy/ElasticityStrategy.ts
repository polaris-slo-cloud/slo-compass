import { PolarisComponent } from '@/workspace/PolarisComponent';
import { ElasticityStrategyConfigParameter } from '@/polaris-templates/parameters';

export default interface ElasticityStrategy extends PolarisComponent {
  kind: string;
  kindPlural: string;
  sloSpecificConfig: ElasticityStrategyConfigParameter[];
  confirmed: boolean;
}
