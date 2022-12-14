import { useSloStore } from '@/store/slo';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { ObjectKind } from '@polaris-sloc/core';
import { ownerToNamespacedObjectReference, SloHelper } from '@/workspace/slo/SloHelper';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useTemplateStore } from '@/store/template';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { toElasticityStrategyCrdObjectKind } from '@/polaris-templates/TemplatesWatchHandler';

export async function updateWorkspaceFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const sloStore = useSloStore();
  const polarisComponentStore = usePolarisComponentStore();
  const helper = new SloHelper();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();

  async function updateSlosForObjectKind(objectKind: ObjectKind) {
    const sloMappings = await orchestratorApi.findSloMappings(objectKind);
    const mappedSlos = [];
    for (const sloMapping of sloMappings.items) {
      const sloId = await helper.createOrUpdateSlo(sloMapping);
      mappedSlos.push(sloId);
    }
    const deletedSlos = sloStore.slos
      .filter(
        (x) =>
          !!x.deployedSloMapping?.reference &&
          x.deployedSloMapping.reference.kind === objectKind.kind &&
          !mappedSlos.includes(x.id)
      )
      .map((x) => x.id);
    if (deletedSlos.length > 0) {
      sloStore.polarisMappingRemoved(deletedSlos);
    }
    bookmarkManager.update(objectKind, sloMappings.metadata.resourceVersion);
  }

  async function updateSloCompliancesForObjectKind(objectKind: ObjectKind) {
    const sloCompliances = await orchestratorApi.findSloCompliances(objectKind);
    for (const obj of sloCompliances.items) {
      const sloReference = ownerToNamespacedObjectReference(obj.metadata.ownerReferences[0], obj.metadata.namespace);
      sloStore.updateSloCompliance(sloReference, obj.spec.sloOutputParams.currSloCompliancePercentage);
    }
    bookmarkManager.update(objectKind, sloCompliances.metadata.resourceVersion);
  }

  for (const objectKind of polarisComponentStore.deployedSloMappings) {
    await updateSlosForObjectKind(objectKind);
  }
  for (const objectKind of polarisComponentStore.deployedElasticityStrategyCrds) {
    await updateSloCompliancesForObjectKind(objectKind);
  }

  const polarisControllers = await orchestratorApi.findPolarisControllers();
  polarisComponentStore.initializePolarisClusterComponents(polarisControllers);
}

export async function loadTemplatesFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const store = useTemplateStore();
  const polarisComponentStore = usePolarisComponentStore();
  const elasticityStrategyStore = useElasticityStrategyStore();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const mapper = orchestratorApi.createPolarisMapper();

  const orchestratorCrds = await orchestratorApi.listTemplateDefinitions();
  if (orchestratorCrds.metadata.resourceVersion !== bookmarkManager.find(orchestratorApi.crdObjectKind.value)) {
    for (const crd of orchestratorCrds.items) {
      if (mapper.isSloTemplateCrd(crd)) {
        const sloTemplate = mapper.mapCrdToSloTemplate(crd);
        store.saveSloTemplateFromPolaris(sloTemplate);
        polarisComponentStore.addDeployedSloMapping(toSloMappingObjectKind(sloTemplate.sloMappingKind));
      } else if (mapper.isElasticityStrategyCrd(crd)) {
        const strategy = mapper.mapCrdToElasticityStrategy(crd);
        elasticityStrategyStore.saveElasticityStrategyFromPolaris(strategy);
        polarisComponentStore.addDeployedElasticityStrategyCrd(toElasticityStrategyCrdObjectKind(strategy.kind));
      }
    }
    bookmarkManager.update(orchestratorApi.crdObjectKind.value, orchestratorCrds.metadata.resourceVersion);
  }
}
