import { WorkspaceComponent } from '@/workspace/PolarisComponent';
import { ElasticityStrategyConfigParameter } from '@/polaris-templates/parameters';

export default interface ElasticityStrategy extends WorkspaceComponent {
  kind: string;
  kindPlural: string;
  sloSpecificConfig: ElasticityStrategyConfigParameter[];
  confirmed: boolean;
}
