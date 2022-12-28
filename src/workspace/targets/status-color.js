import { DeploymentStatus } from '@/orchestrator/orchestrator-api';

export function getStatusColor(status) {
  const map = {
    [DeploymentStatus.Available]: 'green',
    [DeploymentStatus.PartiallyAvailable]: 'orange',
    [DeploymentStatus.Unavailable]: 'red',
    [DeploymentStatus.Unknown]: 'grey',
  };
  return map[status] ?? 'grey';
}
