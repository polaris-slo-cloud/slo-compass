import {
  ComposedMetricSource,
  getTemplate as getSloTemplate,
  SloTemplateMetadata,
} from '@/polaris-templates/slo-template';
import { getTemplate as getElasticityStrategyTemplate } from '@/polaris-templates/strategy-template';
import { generateNamespaceSpec, generateServiceAccount } from '@/orchestrator/kubernetes/generation/common-resources';
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
import Slo from '@/workspace/slo/Slo';
import {
  generateElasticityStrategyClusterRole,
  generateElasticityStrategyClusterRoleBinding,
  generateElasticityStrategyControllerDeployment,
} from '@/orchestrator/kubernetes/generation/elasticity-strategy-controller';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { KubernetesSpecObject } from '@/orchestrator/kubernetes/client';

interface SloResources {
  staticResources: KubernetesObject[];
  sloMapping: KubernetesSpecObject;
}

function generateMetricsResources(metrics: ComposedMetricSource[], namespace: string): KubernetesObject[] {
  if (!metrics) {
    return [];
  }
  return metrics.flatMap((metricSource) => [
    generateServiceAccount(metricSource.controllerName, namespace),
    generateMetricSourceClusterRole(metricSource.controllerName, metricSource.composedMetricResources),
    generateMetricSourceClusterRoleBinding(
      metricSource.controllerName,
      namespace,
      metricSource.composedMetricResources
    ),
    generateComposedMetricsControllerDeployment(metricSource.controllerName, namespace, metricSource.containerImage),
    generateComposedMetricsService(metricSource.controllerName, namespace),
    generateComposedMetricsServiceMonitor(metricSource.controllerName, namespace),
  ]);
}

export default {
  generateSloMapping(slo: Slo, target: SloTarget) {
    const template = getSloTemplate(slo.template);
    const normalizedSloName = slo.name.replaceAll(' ', '-').toLowerCase();
    if (target.deployment) {
      const mappingName = `${normalizedSloName}-${slo.id}`;
      return generateSloMapping(template.sloMappingKind, mappingName, slo, target.deployment);
    }
    return null;
  },
  async generateSloResources(
    slo: Slo,
    target: SloTarget,
    namespace: string,
    template: SloTemplateMetadata
  ): Promise<SloResources> {
    const resources = [];
    resources.push(
      ...generateMetricsResources(
        template.metrics.filter((x) => !!x.metricsController).map((x) => x.metricsController),
        namespace
      )
    );

    const crds = await loadCrdsForTemplate(template.key);
    resources.push(...crds);

    const sloMapping = this.generateSloMapping(slo, target);
    resources.push(
      ...[
        generateNamespaceSpec(namespace),
        generateServiceAccount(template.controllerName, namespace),
        generateSloClusterRole(template.controllerName, template.sloMappingResources),
        generateSloClusterRoleBinding(template.controllerName, namespace, template.sloMappingResources),
        generateSloControllerDeployment(template.controllerName, namespace, template.containerImage),
      ]
    );

    return {
      staticResources: resources,
      sloMapping,
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
        generateElasticityStrategyClusterRole(template.controllerName, template.strategyResources),
        generateElasticityStrategyClusterRoleBinding(template.controllerName, namespace, template.strategyResources),
        generateElasticityStrategyControllerDeployment(template.controllerName, namespace, template.containerImage),
      ]
    );

    return resources;
  },
};
