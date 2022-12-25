import { ApiObject, ObjectKind, POLARIS_API } from '@polaris-sloc/core';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import { toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { ChangeTrackingWatchEventsHandler } from '@/orchestrator/WatchEventsHandler';
import { WatchBookmarkManager } from '@/orchestrator/watch-bookmark-manager';

export function toElasticityStrategyCrdObjectKind(mappingKind: string): ObjectKind {
  return {
    kind: mappingKind,
    group: POLARIS_API.ELASTICITY_GROUP,
    version: 'v1',
  };
}

export class TemplatesWatchHandler implements ChangeTrackingWatchEventsHandler {
  private readonly orchestratorApi = useOrchestratorApi();
  private readonly polarisMapper: PolarisMapper;
  private readonly templateStore = useTemplateStore();
  private readonly elasticityStrategyStore = useElasticityStrategyStore();
  private readonly polarisComponentStore = usePolarisComponentStore();

  constructor(private bookmarkManager: WatchBookmarkManager) {
    this.polarisMapper = this.orchestratorApi.createPolarisMapper();
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
      this.polarisComponentStore.addDeployedElasticityStrategyCrd(toElasticityStrategyCrdObjectKind(strategy.kind));
    }
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    //  If a template is deleted in the orchestrator we still want to keep it locally.
    // Can be redeployed later if necessary
    if (this.polarisMapper.isSloTemplateCrd(obj)) {
      const template = this.polarisMapper.mapCrdToSloTemplate(obj);
      this.polarisComponentStore.removeDeployedSloMapping(toSloMappingObjectKind(template.sloMappingKind));
    } else if (this.polarisMapper.isElasticityStrategyCrd(obj)) {
      const strategy = this.polarisMapper.mapCrdToElasticityStrategy(obj);
      this.polarisComponentStore.removeDeployedElasticityStrategyCrd(toElasticityStrategyCrdObjectKind(strategy.kind));
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

  async loadLatestResourceVersion(objectKind: ObjectKind): Promise<void> {
    const mapper = this.orchestratorApi.createPolarisMapper();
    const orchestratorCrds = await this.orchestratorApi.listTemplateDefinitions();
    if (orchestratorCrds.metadata.resourceVersion !== this.bookmarkManager.find(objectKind)) {
      for (const crd of orchestratorCrds.items) {
        if (mapper.isSloTemplateCrd(crd)) {
          const sloTemplate = mapper.mapCrdToSloTemplate(crd);
          this.templateStore.saveSloTemplateFromPolaris(sloTemplate);
          this.polarisComponentStore.addDeployedSloMapping(toSloMappingObjectKind(sloTemplate.sloMappingKind));
        } else if (mapper.isElasticityStrategyCrd(crd)) {
          const strategy = mapper.mapCrdToElasticityStrategy(crd);
          this.elasticityStrategyStore.saveElasticityStrategyFromPolaris(strategy);
          this.polarisComponentStore.addDeployedElasticityStrategyCrd(toElasticityStrategyCrdObjectKind(strategy.kind));
        }
      }
      this.bookmarkManager.update(objectKind, orchestratorCrds.metadata.resourceVersion);
    }
  }
}
