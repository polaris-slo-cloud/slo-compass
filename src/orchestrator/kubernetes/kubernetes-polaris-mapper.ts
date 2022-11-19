import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import {PolarisElasticityStrategySloOutput, PolarisSloMapping} from '@/workspace/slo/Slo';
import { ApiObject, POLARIS_API } from '@polaris-sloc/core';
import { V1CustomResourceDefinitionSpec } from '@kubernetes/client-node';
import {mapElasticityStrategyParameterFromSchema, mapParameterFromSchema} from '@/orchestrator/kubernetes/helpers';
import { ElasticityStrategyTemplateMetadata } from '@/polaris-templates/strategy-template';
import { ElasticityStrategyConfigParameter } from '@/polaris-templates/parameters';

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
      // TODO: Get if exists
      containerImage: '',
      // TODO: Get if exists
      controllerName: '',
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

  mapCrdToElasticityStrategyTemplate(crd: ApiObject<any>): ElasticityStrategyTemplateMetadata {
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
      elasticityStrategyKind: crdSpec.names.kind,
      elasticityStrategyKindPlural: crdSpec.names.plural,
      displayName,
      sloSpecificConfig,
      description: schema.description,
      // TODO: Get if exists
      containerImage: '',
      // TODO: Get if exists
      controllerName: '',
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

}
