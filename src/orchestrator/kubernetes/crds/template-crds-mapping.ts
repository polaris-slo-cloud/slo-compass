const crdsMap = {
  costEfficiencySlo: ['costefficiencymetricmappings.metrics', 'costefficiencyslomappings.slo'],
  cpuUsageSlo: ['cpuusageslomappings.slo'],
  horizontalElasticityStrategy: ['horizontalelasticitystrategies.elasticity'],
  verticalElasticityStrategy: ['verticalelasticitystrategies.elasticity'],
};

export default async function loadCrdsForTemplate(templateName: string) {
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
