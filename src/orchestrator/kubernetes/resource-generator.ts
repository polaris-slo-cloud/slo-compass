import {
  getTemplate as getSloTemplate,
  SloMetricSource,
  SloTemplateMetadata,
} from '@/polaris-templates/slo-template';
import { getTemplate as getElasticityStrategyTemplate } from '@/polaris-templates/strategy-template';
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
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import Slo, {SloTarget} from '@/workspace/slo/Slo';
import {
  generateElasticityStrategyClusterRole,
  generateElasticityStrategyClusterRoleBinding,
  generateElasticityStrategyControllerDeployment,
} from '@/orchestrator/kubernetes/generation/elasticity-strategy-controller';

interface SloResources {
  staticResources: KubernetesObject[];
  sloMappings: KubernetesObject[];
}

function generateMetricsResources(
  metrics: SloMetricSource[],
  namespace: string
): KubernetesObject[] {
  if (!metrics) {
    return [];
  }
  return metrics.flatMap((metricSource) => [
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
}

export default {
  generateSloMappings(slo: Slo, targets: SloTarget[], namespace: string) {
    const template = getSloTemplate(slo.template);
    const normalizedSloName = slo.name.replaceAll(' ', '-').toLowerCase();
    return targets
      .filter((x) => x.deployment)
      .map((target) => {
        const mappingName = `${normalizedSloName}-${target.deployment.id}`;
        return generateSloMapping(
          template.sloMappingKind,
          namespace,
          mappingName,
          slo,
          target.deployment
        );
      });
  },
  async generateSloResources(
    slo: Slo,
    targets: SloTarget[],
    namespace: string,
    template: SloTemplateMetadata
  ): Promise<SloResources> {
    const resources = [];
    resources.push(...generateMetricsResources(template.metrics, namespace));

    const crds = await loadCrdsForTemplate(template.key);
    resources.push(...crds);

    const sloMappings = this.generateSloMappings(slo, targets, namespace);
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

    return {
      staticResources: resources,
      sloMappings,
    };
  },
  generateElasticityStrategyResources: async function (
    elasticityStrategy: ElasticityStrategy,
    namespace: string
  ): Promise<KubernetesObject[]> {
    const template = getElasticityStrategyTemplate(elasticityStrategy.template);

    const resources = [];
    const crds = await loadCrdsForTemplate(template.key);

    resources.push(...crds);
    resources.push(
      ...[
        generateNamespaceSpec(namespace),
        generateServiceAccount(template.controllerName, namespace),
        generateElasticityStrategyClusterRole(
          template.controllerName,
          template.strategyTypeApiGroup,
          template.strategyResources
        ),
        generateElasticityStrategyClusterRoleBinding(
          template.controllerName,
          namespace,
          template.strategyResources
        ),
        generateElasticityStrategyControllerDeployment(
          template.controllerName,
          namespace,
          template.containerImage
        ),
      ]
    );

    return resources;
  },
};
