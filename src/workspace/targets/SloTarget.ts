import { WorkspaceComponent, WorkspaceComponentId } from '@/workspace/PolarisComponent';
import { IDeployment } from '@/orchestrator/orchestrator-api';

export interface SloTarget extends WorkspaceComponent {
  deployment: IDeployment;
  components: WorkspaceComponentId[];
}
