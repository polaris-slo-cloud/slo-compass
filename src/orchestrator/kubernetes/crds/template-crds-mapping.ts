import { V1CustomResourceDefinition } from '@kubernetes/client-node';

const availableCrds = new Set([
  'costefficiencymetricmappings.metrics',
  'horizontalelasticitystrategies.elasticity',
  'verticalelasticitystrategies.elasticity',
]);

export default async function loadCrdForResource(resourceName: string): Promise<V1CustomResourceDefinition> {
  if (!availableCrds.has(resourceName)) {
    return null;
  }

  // Using a templated import to conform to static checking rules for vite: https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations

  const yaml = await import(`./${resourceName}.polaris-slo-cloud.github.io.yaml`);
  return yaml.default;
}
