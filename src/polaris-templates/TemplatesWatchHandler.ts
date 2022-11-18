import { ApiObject, WatchEventsHandler } from '@polaris-sloc/core';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';

export class TemplatesWatchHandler implements WatchEventsHandler {
  private readonly polarisMapper: PolarisMapper;
  private readonly templateStore = useTemplateStore();

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
    } else if (this.polarisMapper.isElasticityStrategyCrd(obj)) {
      const template = this.polarisMapper.mapCrdToElasticityStrategyTemplate(obj);
      this.templateStore.saveElasticityStrategyFromPolaris(template);
    }
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    // For now, we do not need to do anything. If a template is deleted in the orchestrator we still want to keep it locally.
    // Can be redeployed later if necessary
  }

  onObjectModified(obj: ApiObject<any>): void {
    if (this.polarisMapper.isSloTemplateCrd(obj)) {
      const template = this.polarisMapper.mapCrdToSloTemplate(obj);
      this.templateStore.saveSloTemplateFromPolaris(template);
    } else if (this.polarisMapper.isElasticityStrategyCrd(obj)) {
      const template = this.polarisMapper.mapCrdToElasticityStrategyTemplate(obj);
      this.templateStore.saveElasticityStrategyFromPolaris(template);
    }
  }
}
