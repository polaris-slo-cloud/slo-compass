import { useSloStore } from '@/store/slo';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { getSupportedSloMappingObjectKinds } from '@/workspace/slo/SloMappingWatchHandler';
import { ObjectKind } from '@polaris-sloc/core';
import { SloHelper } from '@/workspace/slo/SloHelper';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useTemplateStore } from '@/store/template';

export async function updateWorkspaceFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const sloStore = useSloStore();
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

  for (const objectKind of getSupportedSloMappingObjectKinds()) {
    await updateSlosForObjectKind(objectKind);
  }
}

export async function loadTemplatesFromOrchestrator() {
  const orchestratorApi = useOrchestratorApi();
  const store = useTemplateStore();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const mapper = orchestratorApi.createPolarisMapper();

  const orchestratorCrds = await orchestratorApi.listTemplateDefinitions();
  if (orchestratorCrds.metadata.resourceVersion !== bookmarkManager.find(orchestratorApi.crdObjectKind.value)) {
    for (const crd of orchestratorCrds.items) {
      if (mapper.isSloTemplateCrd(crd)) {
        store.saveSloTemplateFromPolaris(mapper.mapCrdToSloTemplate(crd));
      }
    }
    bookmarkManager.update(orchestratorApi.crdObjectKind.value, orchestratorCrds.metadata.resourceVersion);
  }
}
