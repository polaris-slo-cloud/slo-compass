import { ApiObject, WatchEventsHandler } from '@polaris-sloc/core';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { usePolarisComponentStore } from '@/store/polaris-component';

export class TemplatesWatchHandler implements WatchEventsHandler {
  private readonly polarisMapper: PolarisMapper;
  private readonly templateStore = useTemplateStore();
  private readonly elasticityStrategyStore = useElasticityStrategyStore();
  private readonly polarisComponentStore = usePolarisComponentStore();

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
      this.polarisComponentStore.addDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
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
      this.polarisComponentStore.removeDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
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
