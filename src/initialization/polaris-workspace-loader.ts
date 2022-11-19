import { useSloStore } from '@/store/slo';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { ObjectKind } from '@polaris-sloc/core';
import { SloHelper } from '@/workspace/slo/SloHelper';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useTemplateStore } from '@/store/template';
import { useWorkspaceStore } from '@/store/workspace';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';

export async function updateWorkspaceFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const sloStore = useSloStore();
  const workspaceStore = useWorkspaceStore();
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

  for (const objectKind of workspaceStore.deployedSloMappings) {
    await updateSlosForObjectKind(objectKind);
  }
}

export async function loadTemplatesFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const store = useTemplateStore();
  const workspaceStore = useWorkspaceStore();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const mapper = orchestratorApi.createPolarisMapper();

  const orchestratorCrds = await orchestratorApi.listTemplateDefinitions();
  if (orchestratorCrds.metadata.resourceVersion !== bookmarkManager.find(orchestratorApi.crdObjectKind.value)) {
    for (const crd of orchestratorCrds.items) {
      if (mapper.isSloTemplateCrd(crd)) {
        const sloTemplate = mapper.mapCrdToSloTemplate(crd);
        store.saveSloTemplateFromPolaris(sloTemplate);
        workspaceStore.addDeployedSloMapping(toSloMappingObjectKind(sloTemplate.sloMappingKind));
      } else if (mapper.isElasticityStrategyCrd(crd)) {
        store.saveElasticityStrategyFromPolaris(mapper.mapCrdToElasticityStrategyTemplate(crd));
      }
    }
    bookmarkManager.update(orchestratorApi.crdObjectKind.value, orchestratorCrds.metadata.resourceVersion);
  }
}
