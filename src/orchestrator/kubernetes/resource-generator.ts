import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { generateNamespaceSpec, generateServiceAccount } from '@/orchestrator/kubernetes/generation/common-resources';
import {
  generateSloClusterRole,
  generateSloClusterRoleBinding,
  generateSloControllerDeployment,
  generateSloMapping,
  generateSloMappingCrd,
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
import { ComposedMetricSource } from '@/polaris-templates/slo-metrics/metrics-template';

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
  generateSloMapping(slo: Slo, target: SloTarget, sloMappingKind: string) {
    const normalizedSloName = slo.name.replaceAll(' ', '-').toLowerCase();
    if (target.deployment) {
      const mappingName = `${normalizedSloName}-${slo.id}`;
      return generateSloMapping(sloMappingKind, mappingName, slo, target.deployment);
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
        slo.metrics
          .map((x) => x.source)
          .filter((x) => !!x.metricsController)
          .map((x) => x.metricsController),
        namespace
      )
    );

    const crds = await loadCrdsForTemplate(template.sloMappingKind);
    resources.push(...crds);

    const sloMapping = this.generateSloMapping(slo, target, template.sloMappingKind);
    resources.push(
      ...[
        generateNamespaceSpec(namespace),
        generateServiceAccount(template.controllerName, namespace),
        generateSloClusterRole(template.controllerName, template.sloMappingKindPlural),
        generateSloClusterRoleBinding(template.controllerName, namespace, template.sloMappingKindPlural),
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
    const resources = [];
    const crds = await loadCrdsForTemplate(elasticityStrategy.kind);

    const controller = elasticityStrategy.polarisControllers[0];
    resources.push(...crds);
    resources.push(generateNamespaceSpec(namespace));
    if (controller) {
      resources.push(
        ...[
          generateServiceAccount(controller.name, namespace),
          generateElasticityStrategyClusterRole(controller.name, elasticityStrategy.kindPlural),
          generateElasticityStrategyClusterRoleBinding(controller.name, namespace, elasticityStrategy.kindPlural),
          generateElasticityStrategyControllerDeployment(controller.name, namespace, controller.containerImage),
        ]
      );
    }

    return resources;
  },
  generateCrdFromSloTemplate: (template: SloTemplateMetadata) =>
    generateSloMappingCrd(
      template.sloMappingKind,
      template.sloMappingKindPlural,
      template.config,
      template.description
    ),
};
