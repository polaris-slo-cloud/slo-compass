import { ConfigParameter, ParameterType } from '@/polaris-templates/parameters';
import { V1JSONSchemaProps } from '@kubernetes/client-node';

const parameterTypeMap = {
  Integer: 'integer',
  Decimal: 'number',
  Resources: 'object',
  Percentage: 'integer',
};
const parameterFormatMap = {
  Integer: 'int64',
  Decimal: 'float',
  Percentage: 'int64',
};

function mapParameter(parameter: ConfigParameter): V1JSONSchemaProps {
  const schemaProps: V1JSONSchemaProps = {
    type: parameterTypeMap[parameter.type],
    format: parameterFormatMap[parameter.type],
  };
  if (parameter.type === ParameterType.Percentage) {
    schemaProps.minimum = 0;
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
