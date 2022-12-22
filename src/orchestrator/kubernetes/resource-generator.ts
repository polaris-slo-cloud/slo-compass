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
import { KubernetesObject, V1Deployment } from '@kubernetes/client-node';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import Slo from '@/workspace/slo/Slo';
import {
  generateElasticityStrategyClusterRole,
  generateElasticityStrategyClusterRoleBinding,
  generateElasticityStrategyControllerDeployment,
} from '@/orchestrator/kubernetes/generation/elasticity-strategy-controller';
import { SloTarget } from '@/workspace/targets/SloTarget';
import { ComposedMetricSource } from '@/polaris-templates/slo-metrics/metrics-template';

export interface PolarisControllerDeploymentResources {
  deployBefore: KubernetesObject[];
  controllerDeployment: V1Deployment;
  deployAfter: KubernetesObject[];
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
  async generateSloControllerResources(
    namespace: string,
    template: SloTemplateMetadata
  ): Promise<PolarisControllerDeploymentResources> {
    return {
      deployBefore: [
        generateNamespaceSpec(namespace),
        generateServiceAccount(template.sloController.name, namespace),
        generateSloClusterRole(template.sloController.name, template.sloMappingKindPlural),
        generateSloClusterRoleBinding(template.sloController.name, namespace, template.sloMappingKindPlural),
      ],
      controllerDeployment: generateSloControllerDeployment(
        template.sloController.name,
        namespace,
        template.sloController.containerImage,
        template.sloMappingKind,
      ),
      deployAfter: [],
    };
  },
  async generateMetricsControllerResources(
    metricSource: ComposedMetricSource,
    namespace: string
  ): Promise<PolarisControllerDeploymentResources> {
    if (!metricSource) {
      return null;
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
      )
    );
    return {
      deployBefore: metricsResoruces,
      controllerDeployment: generateComposedMetricsControllerDeployment(
        metricSource.controllerName,
        namespace,
        metricSource.containerImage,
        metricSource.composedMetricKind
      ),
      deployAfter: [
        generateComposedMetricsService(metricSource.controllerName, namespace),
        generateComposedMetricsServiceMonitor(metricSource.controllerName, namespace),
      ],
    };
  },
  generateElasticityStrategyControllerResources: async function (
    elasticityStrategy: ElasticityStrategy,
    namespace: string
  ): Promise<PolarisControllerDeploymentResources> {
    const controller = elasticityStrategy.controllerDeploymentMetadata;
    if (!controller) {
      return null;
    }

    const resources = [];
    const crd = await loadCrdForResource(`${elasticityStrategy.kindPlural}.elasticity`);
    if (crd) {
      resources.push(crd);
    }

    resources.push(generateNamespaceSpec(namespace));
    resources.push(
      ...[
        generateServiceAccount(controller.name, namespace),
        generateElasticityStrategyClusterRole(controller.name, elasticityStrategy.kindPlural),
        generateElasticityStrategyClusterRoleBinding(controller.name, namespace, elasticityStrategy.kindPlural),
      ]
    );

    return {
      deployBefore: resources,
      controllerDeployment: generateElasticityStrategyControllerDeployment(
        controller.name,
        namespace,
        controller.containerImage,
        elasticityStrategy.kind
      ),
      deployAfter: [],
    };
  },
  generateCrdFromSloTemplate: (template: SloTemplateMetadata) =>
    generateSloMappingCrd(
      template.sloMappingKind,
      template.sloMappingKindPlural,
      template.config,
      template.description
    ),
};
