import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { PolarisElasticityStrategySloOutput, PolarisSloMapping } from '@/workspace/slo/Slo';
import { ApiObject, POLARIS_API } from '@polaris-sloc/core';
import { V1CustomResourceDefinitionSpec, V1DeploymentSpec } from '@kubernetes/client-node';
import { mapElasticityStrategyParameterFromSchema, mapParameterFromSchema } from '@/orchestrator/kubernetes/helpers';
import { ElasticityStrategyConfigParameter } from '@/polaris-templates/parameters';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { workspaceItemTypes } from '@/workspace/constants';
import { PolarisController } from '@/workspace/PolarisComponent';
import { COMMON_LABELS, ControllerTypeMap } from '@/orchestrator/constants';

export class KubernetesPolarisMapper implements PolarisMapper {
  isSloTemplateCrd(crd: ApiObject<any>): boolean {
    return crd.spec?.group === POLARIS_API.SLO_GROUP;
  }

  mapCrdToSloTemplate(crd: ApiObject<any>): SloTemplateMetadata {
    const crdSpec = crd.spec as V1CustomResourceDefinitionSpec;
    const schema = crdSpec.versions[0].schema.openAPIV3Schema;
    const displayName = crdSpec.names.kind
      // Remove SloMapping from name
      .replace('SloMapping', '')
      // Add spaces in front of uppercase letters
      .replace(/([A-Z])/g, ' $1')
      .trim();

    const sloConfigSchema = schema.properties.spec?.properties.sloConfig;
    let sloConfigProperties = [];
    if (sloConfigSchema?.properties) {
      sloConfigProperties = Object.entries(sloConfigSchema.properties).map(([key, schema]) => {
        const isRequired = !!sloConfigSchema.required && sloConfigSchema.required.includes(key);
        return mapParameterFromSchema(key, schema, isRequired);
      });
    }

    return {
      sloMappingKind: crdSpec.names.kind,
      sloMappingKindPlural: crdSpec.names.plural,
      displayName,
      description: schema.description,
      config: sloConfigProperties,
      metricTemplates: [],
      confirmed: false,
    };
  }

  transformToPolarisSloMapping(spec: any, namespace: string): PolarisSloMapping {
    const [targetGroup, targetApiVersion] = spec.targetRef.apiVersion.split('/');
    return {
      config: spec.sloConfig,
      elasticityStrategy: {
        apiVersion: spec.elasticityStrategy.apiVersion,
        kind: spec.elasticityStrategy.kind,
      },
      elasticityStrategyConfig: spec.staticElasticityStrategyConfig || {},
      target: {
        name: spec.targetRef.name,
        namespace: namespace,
        group: targetGroup,
        version: targetApiVersion,
        kind: spec.targetRef.kind,
      },
    };
  }

  isElasticityStrategyCrd(crd: ApiObject<any>): boolean {
    return crd.spec?.group === POLARIS_API.ELASTICITY_GROUP;
  }

  mapCrdToElasticityStrategy(crd: ApiObject<any>): ElasticityStrategy {
    const crdSpec = crd.spec as V1CustomResourceDefinitionSpec;
    const schema = crdSpec.versions[0].schema.openAPIV3Schema;
    const displayName = crdSpec.names.kind
      // Add spaces in front of uppercase letters
      .replace(/([A-Z])/g, ' $1')
      .trim();

    let sloSpecificConfig: ElasticityStrategyConfigParameter[] = [];
    const sloSpecificConfigSchema = schema.properties.spec?.properties.staticConfig;
    if (sloSpecificConfigSchema?.properties) {
      sloSpecificConfig = Object.entries(sloSpecificConfigSchema.properties).map(([key, schema]) => {
        const isRequired = !!sloSpecificConfigSchema.required && sloSpecificConfigSchema.required.includes(key);
        return mapElasticityStrategyParameterFromSchema(key, schema, isRequired);
      });
    }
    return {
      id: crd.metadata.uid,
      type: workspaceItemTypes.elasticityStrategy,
      kind: crdSpec.names.kind,
      kindPlural: crdSpec.names.plural,
      name: displayName,
      sloSpecificConfig,
      description: schema.description,
      confirmed: false,
    };
  }

  transformToPolarisElasticityStrategySloOutput(spec: any, namespace: string): PolarisElasticityStrategySloOutput {
    const [targetGroup, targetApiVersion] = spec.targetRef.apiVersion.split('/');
    return {
      sloOutputParams: spec.sloOutputParams,
      staticConfig: spec.staticConfig,
      target: {
        name: spec.targetRef.name,
        namespace: namespace,
        group: targetGroup,
        version: targetApiVersion,
        kind: spec.targetRef.kind,
      },
    };
  }

  mapToPolarisController(deployment: ApiObject<any>): PolarisController {
    const labels = deployment.metadata.labels;
    if (!labels || !labels[COMMON_LABELS.CONTROLLER_TYPE]) {
      return null;
    }
    return {
      type: ControllerTypeMap[labels[COMMON_LABELS.CONTROLLER_TYPE]],
      handlesKind: labels[COMMON_LABELS.CRD_NAME],
      deployment: {
        ...deployment.objectKind,
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
      },
    };
  }
}
