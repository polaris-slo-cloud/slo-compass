import { ApiObject, WatchEventsHandler } from '@polaris-sloc/core';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { useWorkspaceStore } from '@/store/workspace';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';

export class TemplatesWatchHandler implements WatchEventsHandler {
  private readonly polarisMapper: PolarisMapper;
  private readonly templateStore = useTemplateStore();
  private readonly elasticityStrategyStore = useElasticityStrategyStore();
  private readonly workspaceStore = useWorkspaceStore();

  constructor() {
    const orchestratorApi = useOrchestratorApi();
    this.polarisMapper = orchestratorApi.createPolarisMapper();
  }
  onError(error: Error): void {
    //TODO
  }

  onObjectAdded(obj: ApiObject<any>): void {
    if (this.polarisMapper.isSloTemplateCrd(obj)) {
      const template = this.polarisMapper.mapCrdToSloTemplate(obj);
      this.templateStore.saveSloTemplateFromPolaris(template);
      this.workspaceStore.addDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
    } else if (this.polarisMapper.isElasticityStrategyCrd(obj)) {
      const strategy = this.polarisMapper.mapCrdToElasticityStrategy(obj);
      this.elasticityStrategyStore.saveElasticityStrategyFromPolaris(strategy);
    }
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    //  If a template is deleted in the orchestrator we still want to keep it locally.
    // Can be redeployed later if necessary
    if (this.polarisMapper.isSloTemplateCrd(obj)) {
      const template = this.polarisMapper.mapCrdToSloTemplate(obj);
      this.workspaceStore.removeDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
    }
  }

  onObjectModified(obj: ApiObject<any>): void {
    if (this.polarisMapper.isSloTemplateCrd(obj)) {
      const template = this.polarisMapper.mapCrdToSloTemplate(obj);
      this.templateStore.saveSloTemplateFromPolaris(template);
    } else if (this.polarisMapper.isElasticityStrategyCrd(obj)) {
      const strategy = this.polarisMapper.mapCrdToElasticityStrategy(obj);
      this.elasticityStrategyStore.saveElasticityStrategyFromPolaris(strategy);
    }
  }
}
