import k8sApiProxy from './k8s-api-proxy';

const k8sApi = window.k8sApi ? window.k8sApi : k8sApiProxy;
const polarisMappingOrder = ['slo', 'metrics', 'elasticity'];

function addReferenceToSlo(crdObject, workspace, referenceSetter) {
  const slo = crdObject.metadata.ownerReferences.find((x) =>
    x.apiVersion.startsWith('slo.polaris-slo-cloud.github.io')
  );
  const workspaceSlo = workspace.slos.find((x) => x.id == slo?.uid);
  if (workspaceSlo) {
    referenceSetter(workspaceSlo, crdObject.metadata.uid);
  }
}

function addToWorkspace(customResourceDefinition, crdObject, workspace) {
  const normalizedName = crdObject.kind
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/Mapping$/, '');
  const component = {
    id: crdObject.metadata.uid,
    name: normalizedName,
    polarisKind: crdObject.kind,
  };

  switch (customResourceDefinition.spec.group) {
    case 'metrics.polaris-slo-cloud.github.io':
      addReferenceToSlo(
        crdObject,
        workspace,
        (slo, val) =>
          (slo.metrics = slo.metrics ? [...slo.metrics, val] : [val])
      );
      component.config = crdObject.spec.metricConfig;
      workspace.metrics.push(component);
      break;
    case 'elasticity.polaris-slo-cloud.github.io':
      addReferenceToSlo(
        crdObject,
        workspace,
        (slo, val) => (slo.strategy = val)
      );
      component.config = crdObject.spec.staticConfig;
      component.currentValue = crdObject.spec.sloOutputParams;
      workspace.strategies.push(component);
      break;
    case 'slo.polaris-slo-cloud.github.io':
      component.config = crdObject.spec.sloConfig;
      workspace.slos.push(component);
      break;
  }
}
export default {
  async getControllers() {
    const crds = await k8sApi.getCustomResourceDefinitions();
    const polarisGroupRegex = /([a-zA-Z-]*)\.polaris-slo-cloud\.github\.io/;
    const polarisCrds = crds
      .map((x) => {
        const regexMatch = x.spec.group.match(polarisGroupRegex);
        return {
          type: regexMatch ? regexMatch[1] : null,
          crd: x,
        };
      })
      .filter((x) => x.type);
    polarisCrds.sort(
      (a, b) =>
        polarisMappingOrder.indexOf(a.type) -
        polarisMappingOrder.indexOf(b.type)
    );

    const workspace = {
      targets: [],
      metrics: [],
      slos: [],
      strategies: [],
    };
    for (const { crd } of polarisCrds) {
      const crdObjects = await k8sApi.getCustomResourceObjects(crd);
      for (const crdObject of crdObjects) {
        addToWorkspace(crd, crdObject, workspace);
      }
    }

    return workspace;
  },
};
