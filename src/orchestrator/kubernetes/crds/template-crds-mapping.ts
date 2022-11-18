import { V1CustomResourceDefinition } from '@kubernetes/client-node';

const crdsMap = {
  CostEfficiencySloMapping: ['costefficiencymetricmappings.metrics', 'costefficiencyslomappings.slo'],
  CPUUsageSloMapping: ['cpuusageslomappings.slo'],
  HorizontalElasticityStrategy: ['horizontalelasticitystrategies.elasticity'],
  VerticalElasticityStrategy: ['verticalelasticitystrategies.elasticity'],
};

export default async function loadCrdsForTemplate(templateName: string): Promise<V1CustomResourceDefinition[]> {
  const crdNames = crdsMap[templateName];
  if (!crdNames) {
    return [];
  }

  // Using a templated import to conform to static checking rules for vite: https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  const crds = [];
  for (const name of crdNames) {
    const yaml = await import(`./${name}.polaris-slo-cloud.github.io.yaml`);
    crds.push(yaml.default);
  }
  return crds;
}
