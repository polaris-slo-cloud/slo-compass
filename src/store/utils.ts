import { PolarisComponent } from '@/workspace/PolarisComponent';
import { PolarisDeploymentResult } from '@/orchestrator/orchestrator-api';

export function applyDeploymentResult(item: PolarisComponent, result: PolarisDeploymentResult) {
  item.failedDeployments = result.failedResources;
  item.polarisControllers = item.polarisControllers.map((controller) => {
    const mapped = { ...controller };
    const deployment = result.deployedControllers.find(
      (x) => x.name === controller.name
    )?.deployment;
    if (deployment) {
      mapped.deployment = deployment;
    }
    return mapped;
  });
}
