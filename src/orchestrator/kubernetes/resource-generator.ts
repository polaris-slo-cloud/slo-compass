import { getTemplate } from '@/polaris-templates/slo-template';
import {
  generateNamespaceSpec,
  generateServiceAccount,
} from '@/orchestrator/kubernetes/generation/common-resources';
import {
  generateSloClusterRole,
  generateSloClusterRoleBinding,
  generateSloControllerDeployment,
  generateSloMapping,
} from '@/orchestrator/kubernetes/generation/slo-controller';
import {
  generateComposedMetricsControllerDeployment,
  generateComposedMetricsService,
  generateComposedMetricsServiceMonitor,
  generateMetricSourceClusterRole,
  generateMetricSourceClusterRoleBinding,
} from '@/orchestrator/kubernetes/generation/composed-metrics-controller';
import loadCrdsForTemplate from '@/orchestrator/kubernetes/crds/template-crds-mapping';
import { KubernetesObject } from '@kubernetes/client-node';

export default {
  async generateSloResources(slo, namespace): Promise<KubernetesObject[]> {
    const template = getTemplate(slo.template);
    const resources = [];
    if (template.metrics) {
      const metricMappings = template.metrics.flatMap((metricSource) => [
        generateServiceAccount(metricSource.controllerName, namespace),
        generateMetricSourceClusterRole(
          metricSource.controllerName,
          metricSource.composedMetricResources
        ),
        generateMetricSourceClusterRoleBinding(
          metricSource.controllerName,
          namespace,
          metricSource.composedMetricResources
        ),
        generateComposedMetricsControllerDeployment(
          metricSource.controllerName,
          namespace,
          metricSource.containerImage
        ),
        generateComposedMetricsService(metricSource.controllerName, namespace),
        generateComposedMetricsServiceMonitor(metricSource.controllerName, namespace),
      ]);
      resources.push(...metricMappings);
    }

    const normalizedSloName = slo.name.replaceAll(' ', '-').toLowerCase();
    const sloMappings = slo.targets
      .filter((x) => x.deployment)
      .map((target) => {
        const mappingName = `${normalizedSloName}-${target.deployment.name}`;
        return generateSloMapping(
          template.sloMappingKind,
          namespace,
          mappingName,
          slo.config,
          target.deployment
        );
      });

    resources.push(...sloMappings);
    const crds = await loadCrdsForTemplate(template.key);
    resources.push(...crds);
    resources.push(
      ...[
        generateNamespaceSpec(namespace),
        generateServiceAccount(template.controllerName, namespace),
        generateSloClusterRole(
          template.controllerName,
          template.sloMappingTypeApiGroup,
          template.sloMappingResources
        ),
        generateSloClusterRoleBinding(
          template.controllerName,
          namespace,
          template.sloMappingResources
        ),
        generateSloControllerDeployment(
          template.controllerName,
          namespace,
          template.containerImage
        ),
      ]
    );

    return resources;
  },
};
