import { IConfigureOrchestrator } from '@/orchestrator/orchestrators';
import ApiConnectionsSettings from './connection/ApiConnectionSettings.vue';
import NativeClientConnectionSettings from './connection/NativeClientConnectionSettings.vue';
import PolarisSettings from './connection/PolarisSettings.vue';
import { IOrchestratorConnection } from '@/connections/storage';
import { IPolarisOrchestratorApi } from '@/orchestrator/orchestrator-api';
import KubernetesApi from '@/orchestrator/kubernetes/api';

const configure: IConfigureOrchestrator = {
  name: 'Kubernetes',
  connectionSettingsComponent: {
    native: NativeClientConnectionSettings,
    web: ApiConnectionsSettings,
  },
  polarisSettingsComponent: PolarisSettings,
  createOrchestratorApi: (connection: IOrchestratorConnection): IPolarisOrchestratorApi =>
    new KubernetesApi(connection.connectionSettings as string),
};

export default configure;
