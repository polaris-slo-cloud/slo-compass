import {
  ConfigParameter,
  convertToConfigParameterType,
  convertToElasticityStrategyConfigParameterType,
  ElasticityStrategyConfigParameter,
  ElasticityStrategyParameterType,
  ParameterType,
} from '@/polaris-templates/parameters';
import { V1JSONSchemaProps, V1OwnerReference } from '@kubernetes/client-node';
import { ApiObject, ObjectKind, OwnerReference } from '@polaris-sloc/core';
import { KubernetesSpecObject } from '@/orchestrator/kubernetes/client';

const parameterTypeMap = Object.freeze({
  Integer: 'integer',
  Decimal: 'number',
  Resources: 'object',
  Percentage: 'integer',
});
const parameterFormatMap = Object.freeze({
  Integer: 'int64',
  Decimal: 'float',
  Percentage: 'int64',
});

export function mapParameterFromSchema(
  parameterKey: string,
  schemaProps: V1JSONSchemaProps,
  required: boolean
): ConfigParameter {
  const displayName = parameterKey
    // Uppercase first letter
    .replace(/^([a-z])/g, (_, letter) => letter.toUpperCase())
    // Add spaces in front of uppercase letters
    .replace(/([A-Z])/g, ' $1')
    .trim();
  // Guess the correct parameter type. The user has to review this manually
  let parameterType = ParameterType.Integer;
  if (schemaProps.type === 'number') {
    parameterType = ParameterType.Decimal;
  } else if (schemaProps.minimum === 0) {
    parameterType = ParameterType.Percentage;
  }
  let valueOptions = undefined;
  const enumProps = schemaProps._enum || schemaProps['enum'];
  if (enumProps && enumProps.length > 0) {
    valueOptions = enumProps.map((x) => convertToConfigParameterType(x, parameterType));
  }

  return {
    parameter: parameterKey,
    displayName,
    type: parameterType,
    valueOptions,
    required,
  };
}

export function mapElasticityStrategyParameterFromSchema(
  parameterKey: string,
  schemaProps: V1JSONSchemaProps,
  required: boolean
): ElasticityStrategyConfigParameter {
  const displayName = parameterKey
    // Uppercase first letter
    .replace(/^([a-z])/g, (_, letter) => letter.toUpperCase())
    // Add spaces in front of uppercase letters
    .replace(/([A-Z])/g, ' $1')
    .trim();
  // Guess the correct parameter type. The user has to review this manually
  let parameterType = ElasticityStrategyParameterType.Integer;
  if (schemaProps.type === 'number') {
    parameterType = ElasticityStrategyParameterType.Decimal;
  } else if (schemaProps.type === 'object') {
    parameterType = ElasticityStrategyParameterType.Resources;
  } else if (schemaProps.minimum === 0) {
    parameterType = ElasticityStrategyParameterType.Percentage;
  }
  let valueOptions = undefined;
  const enumProps = schemaProps._enum || schemaProps['enum'];
  if (enumProps && enumProps.length > 0) {
    valueOptions = enumProps.map((x) => convertToElasticityStrategyConfigParameterType(x, parameterType));
  }
  return {
    parameter: parameterKey,
    displayName,
    type: parameterType,
    valueOptions,
    required,
  };
}

function mapParameter(parameter: ConfigParameter): V1JSONSchemaProps {
  const schemaProps: V1JSONSchemaProps = {
    type: parameterTypeMap[parameter.type],
    format: parameterFormatMap[parameter.type],
  };
  if (parameter.type === ParameterType.Percentage) {
    schemaProps.minimum = 0;
  }
  if (parameter.valueOptions) {
    schemaProps._enum = parameter.valueOptions;
    // Necessary for web version when k8s library is not used
    schemaProps['enum'] = parameter.valueOptions;
  }

  return schemaProps;
}

export function convertParametersToSchemaProperties(parameters: ConfigParameter[]): {
  [key: string]: V1JSONSchemaProps;
} {
  return parameters.reduce((props, currentParameter) => {
    props[currentParameter.parameter] = mapParameter(currentParameter);
    return props;
  }, {});
}

function mapElasticityStrategyParameter(parameter: ElasticityStrategyConfigParameter): V1JSONSchemaProps {
  const schemaProps: V1JSONSchemaProps = {
    type: parameterTypeMap[parameter.type],
    format: parameterFormatMap[parameter.type],
  };
  if (parameter.type === ElasticityStrategyParameterType.Percentage) {
    schemaProps.minimum = 0;
  }
  if (parameter.valueOptions) {
    schemaProps._enum = parameter.valueOptions;
    // Necessary for web version when k8s library is not used
    schemaProps['enum'] = parameter.valueOptions;
  }

  return schemaProps;
}

export function convertElasticityStrategyConfigParametersToSchemaProperties(
  parameters: ElasticityStrategyConfigParameter[]
): {
  [key: string]: V1JSONSchemaProps;
} {
  return parameters.reduce((props, currentParameter) => {
    props[currentParameter.parameter] = mapElasticityStrategyParameter(currentParameter);
    return props;
  }, {});
}

export function transformK8sOwnerReference(ownerReference: V1OwnerReference): OwnerReference {
  const [group, version] = ownerReference.apiVersion.split('/');
  return {
    group,
    version,
    kind: ownerReference.kind,
    name: ownerReference.name,
    uid: ownerReference.uid,
    blockOwnerDeletion: ownerReference.blockOwnerDeletion,
    controller: ownerReference.controller,
  };
}

export function transformToApiObject(k8sObject: KubernetesSpecObject, objectKind: ObjectKind): ApiObject<any> {
  const apiObject = new ApiObject();
  apiObject.objectKind = objectKind;
  apiObject.metadata = {
    uid: k8sObject.metadata.uid,
    name: k8sObject.metadata.name,
    namespace: k8sObject.metadata.namespace,
    labels: k8sObject.metadata.labels,
    ownerReferences: k8sObject.metadata.ownerReferences?.map(transformK8sOwnerReference),
    resourceVersion: k8sObject.metadata.resourceVersion,
    generation: k8sObject.metadata.generation,
  };
  apiObject.spec = k8sObject.spec;

  return apiObject;
}
