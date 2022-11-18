import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { SloTemplateMetadata } from '@/polaris-templates/slo-template';
import { PolarisSloMapping } from '@/workspace/slo/Slo';
import { ApiObject, POLARIS_API } from '@polaris-sloc/core';
import { V1CustomResourceDefinitionSpec } from '@kubernetes/client-node';
import { mapParameterFromSchema } from '@/orchestrator/kubernetes/helpers';

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
    if (sloConfigSchema) {
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
}
