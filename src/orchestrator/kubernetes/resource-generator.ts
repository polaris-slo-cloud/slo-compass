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
import loadCrdForResource from '@/orchestrator/kubernetes/crds/template-crds-mapping';
import { KubernetesObject } from '@kubernetes/client-node';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import Slo from '@/workspace/slo/Slo';
import {
  generateElasticityStrategyClusterRole,
  generateElasticityStrategyClusterRoleBinding,
  generateElasticityStrategyControllerDeployment,
} from '@/orchestrator/kubernetes/generation/elasticity-strategy-controller';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { ComposedMetricSource } from '@/polaris-templates/slo-metrics/metrics-template';
import { PolarisControllerDeploymentMetadata } from '@/workspace/PolarisComponent';

export default {
  generateSloMapping(slo: Slo, target: SloTarget, sloMappingKind: string) {
    const normalizedSloName = slo.name.replaceAll(' ', '-').toLowerCase();
    if (target.deployment) {
      const mappingName = `${normalizedSloName}-${slo.id}`;
      return generateSloMapping(sloMappingKind, mappingName, slo, target.deployment);
    }
    return null;
  },
  async generateSloControllerResources(
    slo: Slo,
    namespace: string,
    template: SloTemplateMetadata
  ): Promise<KubernetesObject[]> {
    return [
      generateNamespaceSpec(namespace),
      generateServiceAccount(template.controllerName, namespace),
      generateSloClusterRole(template.controllerName, template.sloMappingKindPlural),
      generateSloClusterRoleBinding(template.controllerName, namespace, template.sloMappingKindPlural),
      generateSloControllerDeployment(template.controllerName, namespace, template.containerImage),
    ];
  },
  async generateMetricsControllerResources(
    metricSource: ComposedMetricSource,
    namespace: string
  ): Promise<KubernetesObject[]> {
    if (!metricSource) {
      return [];
    }
    const metricsResoruces = [];
    const crd = await loadCrdForResource(`${metricSource.composedMetricKindPlural}.metrics`);
    if (crd) {
      metricsResoruces.push(crd);
    }
    metricsResoruces.push(
      generateServiceAccount(metricSource.controllerName, namespace),
      generateMetricSourceClusterRole(metricSource.controllerName, metricSource.composedMetricKindPlural),
      generateMetricSourceClusterRoleBinding(
        metricSource.controllerName,
        namespace,
        metricSource.composedMetricKindPlural
      ),
      generateComposedMetricsControllerDeployment(metricSource.controllerName, namespace, metricSource.containerImage),
      generateComposedMetricsService(metricSource.controllerName, namespace),
      generateComposedMetricsServiceMonitor(metricSource.controllerName, namespace)
    );
    return metricsResoruces;
  },
  generateElasticityStrategyControllerResources: async function (
    elasticityStrategy: ElasticityStrategy,
    namespace: string,
    controller: PolarisControllerDeploymentMetadata
  ): Promise<KubernetesObject[]> {
    const resources = [];
    const crd = await loadCrdForResource(`${elasticityStrategy.kindPlural}.elasticity`);
    if (crd) {
      resources.push(crd);
    }

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
